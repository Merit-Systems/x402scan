import { registerResource } from '@/lib/resources';
import { after, NextResponse, type NextRequest } from 'next/server';

import { Prisma } from '@prisma/client';

const RESPONSE_HEADER_BLOCKLIST = new Set([
  'content-encoding',
  'transfer-encoding',
  'content-length',
]);
const REQUEST_HEADER_BLOCKLIST = new Set(['host', 'content-length']);

async function proxy(request: NextRequest) {
  const startTime = Date.now();
  const queryUrl = request.nextUrl.searchParams.get('url');

  if (!queryUrl) {
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 }
    );
  }

  const url = decodeURIComponent(queryUrl);

  let targetUrl: URL;
  try {
    targetUrl = new URL(url);
  } catch {
    return NextResponse.json(
      { error: 'Invalid url parameter' },
      { status: 400 }
    );
  }

  const clonedRequest = request.clone();

  const upstreamHeaders = new Headers();
  request.headers.forEach((value, key) => {
    if (!REQUEST_HEADER_BLOCKLIST.has(key.toLowerCase())) {
      upstreamHeaders.set(key, value);
    }
  });

  // Log all of the upstream headers before sending the request.
  const upstreamHeadersObj: Record<string, string> = {};
  upstreamHeaders.forEach((value, key) => {
    upstreamHeadersObj[key] = value;
  });

  const method = request.method.toUpperCase();
  let body: ArrayBuffer | undefined;
  let requestBodySize = 0;

  if (method !== 'GET' && method !== 'HEAD') {
    body = await request.arrayBuffer();
    requestBodySize = body.byteLength;
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
    upstreamResponse.headers.forEach((value, key) => {
      if (!RESPONSE_HEADER_BLOCKLIST.has(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });
    responseHeaders.set('url', targetUrl.toString());

    const clonedUpstreamResponse = upstreamResponse.clone();

    after(async () => {
      if (clonedUpstreamResponse.status === 402) {
        const upstreamX402Response =
          (await clonedUpstreamResponse.json()) as unknown;
        console.log('upstreamX402Response', upstreamX402Response);
        await registerResource(targetUrl.toString(), upstreamX402Response);
      } else {
        const cleanedTargetUrl = (() => {
          const urlObj = new URL(targetUrl.toString());
          urlObj.search = '';
          return urlObj.toString();
        })();
        const data = {
          statusCode: clonedUpstreamResponse.status,
          statusText: clonedUpstreamResponse.statusText,
          method,
          duration: fetchDuration,
          url: targetUrl.toString(),
          requestContentType: request.headers.get('content-type') ?? '',
          responseContentType:
            clonedUpstreamResponse.headers.get('content-type') ?? '',
          ...(request.nextUrl.searchParams.get('share_data') === 'true'
            ? {
                requestBody: await extractRequestBody(clonedRequest),
                requestHeaders: Object.fromEntries(clonedRequest.headers),
                responseBody: await extractResponseBody(clonedUpstreamResponse),
                responseHeaders: Object.fromEntries(
                  clonedUpstreamResponse.headers
                ),
              }
            : {}),
        };
        // TODO(alvaro): should figure out a way to keep track of response but not in db
        console.log({ cleanedTargetUrl, data });
      }
    });

    return new NextResponse(upstreamResponse.body, {
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
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;

const extractRequestBody = async (request: Request) => {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return (await request.json()) as Prisma.InputJsonValue;
  } else if (contentType.includes('application/x-www-form-urlencoded')) {
    const formData = await request.formData();
    return Object.fromEntries(formData.entries()) as Prisma.InputJsonValue;
  } else if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    return Object.fromEntries(formData.entries()) as Prisma.InputJsonValue;
  } else if (contentType.includes('text/')) {
    return (await request.text()) as Prisma.InputJsonValue;
  }
  return Prisma.JsonNull;
};

const extractResponseBody = async (response: Response) => {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    try {
      return (await response.json()) as Prisma.InputJsonValue;
    } catch {
      return Prisma.JsonNull;
    }
  } else if (contentType.includes('text/')) {
    try {
      return await response.text();
    } catch {
      return Prisma.JsonNull;
    }
  } else if (contentType.includes('application/octet-stream')) {
    try {
      const arrayBuffer = await response.arrayBuffer();
      // Convert ArrayBuffer to a base64-encoded string for JsonValue compatibility
      return {
        type: 'Buffer',
        data: Array.from(new Uint8Array(arrayBuffer)),
      };
    } catch {
      return Prisma.JsonNull;
    }
  } else if (contentType) {
    try {
      return await response.text();
    } catch {
      return Prisma.JsonNull;
    }
  }

  return Prisma.JsonNull;
};
