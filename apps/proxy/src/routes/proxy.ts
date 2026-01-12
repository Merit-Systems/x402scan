import { Hono } from 'hono';

import { insertResourceInvocation } from '@x402scan/analytics-db';
import { randomUUID } from 'crypto';

import type { Context } from 'hono';

const RESPONSE_HEADER_BLOCKLIST = new Set([
  'transfer-encoding',
  'content-length',
]);
const REQUEST_HEADER_BLOCKLIST = new Set(['host', 'content-length']);

const extractRequestBody = async (request: Request) => {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return (await request.json()) as unknown;
  } else if (contentType.includes('application/x-www-form-urlencoded')) {
    const formData = await request.formData();
    return Object.fromEntries(formData.entries());
  } else if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    return Object.fromEntries(formData.entries());
  } else if (contentType.includes('text/')) {
    return await request.text();
  }
  return null;
};

const extractResponseBody = async (response: Response) => {
  const contentType = response.headers.get('content-type') ?? '';
  const contentEncoding = response.headers.get('content-encoding');

  console.log('[extractResponseBody] Starting', {
    contentType,
    contentEncoding,
    bodyUsed: response.bodyUsed,
    bodyLocked: response.body?.locked ?? 'unknown',
  });

  if (contentType.includes('application/json')) {
    try {
      const result = (await response.json()) as unknown;
      console.log('[extractResponseBody] Successfully parsed JSON');
      return result;
    } catch (error) {
      console.error('[extractResponseBody] Failed to parse JSON', {
        error: error instanceof Error ? error.message : String(error),
        bodyUsed: response.bodyUsed,
      });
      return null;
    }
  } else if (contentType.includes('text/')) {
    try {
      const result = await response.text();
      console.log('[extractResponseBody] Successfully read text', {
        length: result.length,
        preview: result.substring(0, 100),
      });
      return result;
    } catch (error) {
      console.error('[extractResponseBody] Failed to read text', {
        error: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : undefined,
        bodyUsed: response.bodyUsed,
      });
      return null;
    }
  } else if (contentType.includes('application/octet-stream')) {
    try {
      const arrayBuffer = await response.arrayBuffer();
      // Convert ArrayBuffer to a base64-encoded string
      const result = {
        type: 'Buffer',
        data: Array.from(new Uint8Array(arrayBuffer)),
      };
      console.log('[extractResponseBody] Successfully read arrayBuffer', {
        size: arrayBuffer.byteLength,
      });
      return result;
    } catch (error) {
      console.error('[extractResponseBody] Failed to read arrayBuffer', {
        error: error instanceof Error ? error.message : String(error),
        bodyUsed: response.bodyUsed,
      });
      return null;
    }
  } else if (contentType) {
    try {
      const result = await response.text();
      console.log('[extractResponseBody] Successfully read text (fallback)', {
        length: result.length,
      });
      return result;
    } catch (error) {
      console.error('[extractResponseBody] Failed to read text (fallback)', {
        error: error instanceof Error ? error.message : String(error),
        bodyUsed: response.bodyUsed,
      });
      return null;
    }
  }

  console.log('[extractResponseBody] No content type, returning null');
  return null;
};

async function proxyHandler(c: Context) {
  const startTime = Date.now();
  const queryUrl = c.req.query('url');

  if (!queryUrl) {
    return c.json({ error: 'Missing url parameter' }, 400);
  }

  const url = decodeURIComponent(queryUrl);

  let targetUrl: URL;
  try {
    targetUrl = new URL(url);
  } catch {
    return c.json({ error: 'Invalid url parameter' }, 400);
  }

  const upstreamHeaders = new Headers();
  c.req.raw.headers.forEach((value: string, key: string) => {
    if (!REQUEST_HEADER_BLOCKLIST.has(key.toLowerCase())) {
      upstreamHeaders.set(key, value);
    }
  });

  const method = c.req.method.toUpperCase();
  let body: ArrayBuffer | undefined;
  let requestBodySize = 0;

  const clonedRequest = c.req.raw.clone();

  if (method !== 'GET' && method !== 'HEAD') {
    const requestBody = await c.req.arrayBuffer();
    body = requestBody;
    requestBodySize = requestBody.byteLength;
  }

  console.log('[Proxy Request]', {
    method,
    url: targetUrl.toString(),
    requestBodySize,
    timestamp: new Date().toISOString(),
  });

  try {
    // Log request details including compression headers
    const requestCompressionHeaders = {
      'accept-encoding': upstreamHeaders.get('accept-encoding'),
      'content-encoding': upstreamHeaders.get('content-encoding'),
      'content-type': upstreamHeaders.get('content-type'),
      'content-length': upstreamHeaders.get('content-length'),
    };

    console.log('[Proxy Fetch Start]', {
      method,
      url: targetUrl.toString(),
      requestCompressionHeaders,
      hasBody: body !== undefined,
      bodySize: body?.byteLength,
      timestamp: new Date().toISOString(),
    });

    const upstreamResponse = await fetch(targetUrl, {
      method,
      headers: upstreamHeaders,
      body,
    });

    const fetchDuration = Date.now() - startTime;
    const contentLength = upstreamResponse.headers.get('content-length');
    const responseBodySize = contentLength ? parseInt(contentLength) : null;

    const responseCompressionHeaders = {
      'content-encoding': upstreamResponse.headers.get('content-encoding'),
      'content-length': upstreamResponse.headers.get('content-length'),
      'content-type': upstreamResponse.headers.get('content-type'),
      'transfer-encoding': upstreamResponse.headers.get('transfer-encoding'),
    };

    console.log('[Proxy Response]', {
      method,
      url: targetUrl.toString(),
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      responseBodySize,
      responseCompressionHeaders,
      fetchDuration,
      bodyUsed: upstreamResponse.bodyUsed,
      timestamp: new Date().toISOString(),
    });

    const responseHeaders = new Headers();
    upstreamResponse.headers.forEach((value: string, key: string) => {
      if (!RESPONSE_HEADER_BLOCKLIST.has(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });
    responseHeaders.set('url', targetUrl.toString());

    // Log body state before cloning
    console.log('[Proxy Before Clone]', {
      url: targetUrl.toString(),
      originalBodyUsed: upstreamResponse.bodyUsed,
      originalBody: upstreamResponse.body ? 'present' : 'null',
      originalBodyLocked: upstreamResponse.body?.locked ?? 'unknown',
    });

    const shareData = c.req.query('share_data') === 'true';

    // Strategy: If we need to read the body for logging (shareData), we clone and use clone for async.
    // Otherwise, we can use the original for return without cloning.
    // For return, we always use a clone to ensure the body stream isn't consumed by async handler.
    let clonedUpstreamResponse: Response | null = null;
    let returnResponse: Response;

    if (shareData) {
      // We need to read body for logging, so clone for async handler
      try {
        clonedUpstreamResponse = upstreamResponse.clone();
        console.log('[Proxy After Clone]', {
          url: targetUrl.toString(),
          originalBodyUsed: upstreamResponse.bodyUsed,
          clonedBodyUsed: clonedUpstreamResponse.bodyUsed,
          clonedBody: clonedUpstreamResponse.body ? 'present' : 'null',
          clonedBodyLocked: clonedUpstreamResponse.body?.locked ?? 'unknown',
        });
        // Use original for return (clone is for async)
        returnResponse = upstreamResponse;
      } catch (cloneError) {
        console.error('[Proxy Clone Error]', {
          url: targetUrl.toString(),
          error:
            cloneError instanceof Error
              ? cloneError.message
              : String(cloneError),
          originalBodyUsed: upstreamResponse.bodyUsed,
          originalBody: upstreamResponse.body ? 'present' : 'null',
        });
        // If clone fails, use original for both
        clonedUpstreamResponse = upstreamResponse;
        returnResponse = upstreamResponse;
      }
    } else {
      // No need to read body, use original directly
      returnResponse = upstreamResponse;
    }

    // Handle response asynchronously (similar to Next.js 'after')
    if (shareData && clonedUpstreamResponse) {
      void (async () => {
        try {
          if (clonedUpstreamResponse.status === 402) {
            const upstreamX402Response =
              (await clonedUpstreamResponse.json()) as unknown;
            console.log('[402 Response]', {
              url: targetUrl.toString(),
              data: upstreamX402Response,
            });
          } else {
            const cleanedTargetUrl = (() => {
              const urlObj = new URL(targetUrl.toString());
              urlObj.search = '';
              return urlObj.toString();
            })();

            let requestBody: unknown = undefined;
            let requestHeaders: Record<string, string> | undefined = undefined;
            let responseBody: unknown = undefined;
            let responseHeaders: Record<string, string> | undefined = undefined;

            try {
              requestBody = await extractRequestBody(clonedRequest);
            } catch (error) {
              console.error('[Proxy Extract Request Body Error]', {
                url: targetUrl.toString(),
                error: error instanceof Error ? error.message : String(error),
              });
            }

            try {
              requestHeaders = Object.fromEntries(clonedRequest.headers);
            } catch (error) {
              console.error('[Proxy Extract Request Headers Error]', {
                url: targetUrl.toString(),
                error: error instanceof Error ? error.message : String(error),
              });
            }

            try {
              console.log('[Proxy Extract Response Body Start]', {
                url: targetUrl.toString(),
                clonedBodyUsed: clonedUpstreamResponse.bodyUsed,
                clonedBodyLocked:
                  clonedUpstreamResponse.body?.locked ?? 'unknown',
              });
              responseBody = await extractResponseBody(clonedUpstreamResponse);
              console.log('[Proxy Extract Response Body Success]', {
                url: targetUrl.toString(),
                responseBodyType: typeof responseBody,
                responseBodyIsNull: responseBody === null,
              });
            } catch (error) {
              console.error('[Proxy Extract Response Body Error]', {
                url: targetUrl.toString(),
                error: error instanceof Error ? error.message : String(error),
                errorName: error instanceof Error ? error.name : undefined,
                errorStack: error instanceof Error ? error.stack : undefined,
                clonedBodyUsed: clonedUpstreamResponse.bodyUsed,
                clonedBodyLocked:
                  clonedUpstreamResponse.body?.locked ?? 'unknown',
              });
            }

            try {
              responseHeaders = Object.fromEntries(
                clonedUpstreamResponse.headers
              );
            } catch (error) {
              console.error('[Proxy Extract Response Headers Error]', {
                url: targetUrl.toString(),
                error: error instanceof Error ? error.message : String(error),
              });
            }

            const data = {
              statusCode: clonedUpstreamResponse.status,
              statusText: clonedUpstreamResponse.statusText,
              method,
              duration: fetchDuration,
              url: targetUrl.toString(),
              requestContentType:
                clonedRequest.headers.get('content-type') ?? '',
              responseContentType:
                clonedUpstreamResponse.headers.get('content-type') ?? '',
              requestBody,
              requestHeaders,
              responseBody,
              responseHeaders,
            };
            console.log('[Proxy Data]', { cleanedTargetUrl, data });

            // Insert into ClickHouse (non-blocking, fire-and-forget)
            // IMPORTANT: Must catch errors to prevent unhandled rejection crashes
            insertResourceInvocation({
              id: randomUUID(),
              resource_id: null, // TODO: lookup resourceId by URL if needed
              status_code: clonedUpstreamResponse.status,
              duration: fetchDuration,
              status_text: clonedUpstreamResponse.statusText,
              method,
              url: targetUrl.toString(),
              request_content_type:
                clonedRequest.headers.get('content-type') ?? '',
              response_content_type:
                clonedUpstreamResponse.headers.get('content-type') ?? '',
              response_headers: responseHeaders,
              response_body: responseBody,
              request_headers: requestHeaders,
              request_body: requestBody,
              created_at: new Date(),
            }).catch(error => {
              // Silently ignore ClickHouse errors - analytics shouldn't crash the proxy
              console.warn('[Proxy ClickHouse Error]', {
                url: targetUrl.toString(),
                error: error instanceof Error ? error.message : String(error),
              });
            });
          }
        } catch (error) {
          console.error('[Proxy After Error]', {
            url: targetUrl.toString(),
            error: error instanceof Error ? error.message : String(error),
          });
        }
      })();
    }

    // Log body state before returning
    console.log('[Proxy Before Return]', {
      url: targetUrl.toString(),
      originalBodyUsed: upstreamResponse.bodyUsed,
      returnBodyUsed: returnResponse.bodyUsed,
      returnBody: returnResponse.body ? 'present' : 'null',
      returnBodyLocked: returnResponse.body?.locked ?? 'unknown',
    });

    return new Response(returnResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    const errorDuration = Date.now() - startTime;

    // Extract detailed error information
    const errorDetails: Record<string, unknown> = {
      method,
      url: targetUrl.toString(),
      error: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : typeof error,
      errorStack: error instanceof Error ? error.stack : undefined,
      duration: errorDuration,
      timestamp: new Date().toISOString(),
    };

    // Add request details for debugging
    const requestCompressionHeaders = {
      'accept-encoding': upstreamHeaders.get('accept-encoding'),
      'content-encoding': upstreamHeaders.get('content-encoding'),
      'content-type': upstreamHeaders.get('content-type'),
      'content-length': upstreamHeaders.get('content-length'),
    };
    errorDetails.requestCompressionHeaders = requestCompressionHeaders;
    errorDetails.hasBody = body !== undefined;
    errorDetails.bodySize = body?.byteLength;

    // Check for specific error types
    if (error instanceof Error) {
      // Check for DNS errors
      if (
        error.message.includes('ENOTFOUND') ||
        error.message.includes('getaddrinfo')
      ) {
        errorDetails.errorType = 'DNS_ERROR';
      }
      // Check for connection errors
      else if (
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ECONNRESET')
      ) {
        errorDetails.errorType = 'CONNECTION_ERROR';
      }
      // Check for timeout errors
      else if (
        error.message.includes('timeout') ||
        error.message.includes('TIMEOUT')
      ) {
        errorDetails.errorType = 'TIMEOUT_ERROR';
      }
      // Check for SSL/TLS errors
      else if (
        error.message.includes('certificate') ||
        error.message.includes('SSL') ||
        error.message.includes('TLS')
      ) {
        errorDetails.errorType = 'SSL_ERROR';
      }
      // Check for fetch-specific errors
      else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorDetails.errorType = 'FETCH_ERROR';
      }
    }

    // Check if error has a cause (Node.js 18+)
    if (error instanceof Error && 'cause' in error) {
      errorDetails.cause = error.cause;
    }

    console.error('[Proxy Error]', errorDetails);

    const message =
      error instanceof Error ? error.message : 'Unknown upstream error';
    return c.json({ error: message }, 502);
  }
}

export function registerProxyRouter(app: Hono) {
  app.get('/api/proxy', proxyHandler);
  app.post('/api/proxy', proxyHandler);
  app.put('/api/proxy', proxyHandler);
  app.patch('/api/proxy', proxyHandler);
  app.delete('/api/proxy', proxyHandler);
}
