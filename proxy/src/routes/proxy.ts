import { Hono } from 'hono';
import type { Context } from 'hono';
import { insertResourceInvocation } from '../db/clickhouse.js';
import { randomUUID } from 'crypto';

const RESPONSE_HEADER_BLOCKLIST = new Set([
  'content-encoding',
  'transfer-encoding',
  'content-length',
]);
const REQUEST_HEADER_BLOCKLIST = new Set(['host', 'content-length']);

const extractRequestBody = async (request: Request) => {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return await request.json();
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

  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  } else if (contentType.includes('text/')) {
    try {
      return await response.text();
    } catch {
      return null;
    }
  } else if (contentType.includes('application/octet-stream')) {
    try {
      const arrayBuffer = await response.arrayBuffer();
      // Convert ArrayBuffer to a base64-encoded string
      return {
        type: 'Buffer',
        data: Array.from(new Uint8Array(arrayBuffer)),
      };
    } catch {
      return null;
    }
  } else if (contentType) {
    try {
      return await response.text();
    } catch {
      return null;
    }
  }

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
    const upstreamResponse = await fetch(targetUrl, {
      method,
      headers: upstreamHeaders,
      body,
    });

    const fetchDuration = Date.now() - startTime;
    const contentLength = upstreamResponse.headers.get('content-length');
    const responseBodySize = contentLength ? parseInt(contentLength) : null;

    console.log('[Proxy Response]', {
      method,
      url: targetUrl.toString(),
      status: upstreamResponse.status,
      responseBodySize,
      contentType: upstreamResponse.headers.get('content-type'),
      fetchDuration,
      timestamp: new Date().toISOString(),
    });

    const responseHeaders = new Headers();
    upstreamResponse.headers.forEach((value: string, key: string) => {
      if (!RESPONSE_HEADER_BLOCKLIST.has(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });
    responseHeaders.set('url', targetUrl.toString());

    const clonedUpstreamResponse = upstreamResponse.clone();

    // Handle response asynchronously (similar to Next.js 'after')
    (async () => {
      try {
        if (clonedUpstreamResponse.status === 402) {
          const upstreamX402Response = await clonedUpstreamResponse.json();
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

          const shareData = c.req.query('share_data') === 'true';
          const requestBody = shareData ? await extractRequestBody(clonedRequest) : undefined;
          const requestHeaders = shareData ? Object.fromEntries(clonedRequest.headers) : undefined;
          const responseBody = shareData ? await extractResponseBody(clonedUpstreamResponse) : undefined;
          const responseHeaders = shareData ? Object.fromEntries(clonedUpstreamResponse.headers) : undefined;

          const data = {
            statusCode: clonedUpstreamResponse.status,
            statusText: clonedUpstreamResponse.statusText,
            method,
            duration: fetchDuration,
            url: targetUrl.toString(),
            requestContentType: clonedRequest.headers.get('content-type') ?? '',
            responseContentType:
              clonedUpstreamResponse.headers.get('content-type') ?? '',
            ...(shareData
              ? {
                  requestBody,
                  requestHeaders,
                  responseBody,
                  responseHeaders,
                }
              : {}),
          };
          console.log('[Proxy Data]', { cleanedTargetUrl, data });

          // Insert into ClickHouse (non-blocking, fire-and-forget)
          insertResourceInvocation({
            id: randomUUID(),
            resourceId: null, // TODO: lookup resourceId by URL if needed
            statusCode: clonedUpstreamResponse.status,
            duration: fetchDuration,
            statusText: clonedUpstreamResponse.statusText,
            method,
            url: targetUrl.toString(),
            requestContentType: clonedRequest.headers.get('content-type') ?? '',
            responseContentType: clonedUpstreamResponse.headers.get('content-type') ?? '',
            responseHeaders,
            responseBody,
            requestHeaders,
            requestBody,
            createdAt: new Date(),
          });
        }
      } catch (error) {
        console.error('[Proxy After Error]', {
          url: targetUrl.toString(),
          error: error instanceof Error ? error.message : String(error),
        });
      }
    })();

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    const errorDuration = Date.now() - startTime;
    console.error('[Proxy Error]', {
      method,
      url: targetUrl.toString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: errorDuration,
      timestamp: new Date().toISOString(),
    });
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