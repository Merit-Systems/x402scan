import { env } from '@/env';

const PROXY_ENDPOINT = '/api/proxy' as const;

export const fetchWithProxy = async (
  input: URL | RequestInfo,
  requestInit?: RequestInit
) => {
  // #region agent log
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  fetch('http://127.0.0.1:7242/ingest/b580f9ca-6e18-4c38-9de1-256e6503a55a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apps/scan/src/lib/x402/proxy-fetch.ts:9',message:'fetchWithProxy entry',data:{inputType:input instanceof Request?'Request':typeof input,initMethod:requestInit?.method,initBodyType:typeof requestInit?.body,initBodyPreview:typeof requestInit?.body==='string'?requestInit.body.slice(0,120):undefined,initContentType:requestInit?.headers?new Headers(requestInit.headers).get('content-type'):undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H2'})}).catch(()=>{});
  // #endregion
  let url: string;
  let effectiveInit: RequestInit | undefined = requestInit;

  if (input instanceof Request) {
    url = input.url;
    if (!requestInit) {
      const clonedRequest = input.clone();

      let body: string | undefined;
      if (input.method !== 'GET' && input.method !== 'HEAD') {
        try {
          body = await clonedRequest.text();
          if (!body) body = undefined;
        } catch {
          body = undefined;
        }
      }

      effectiveInit = {
        method: input.method,
        headers: input.headers,
        body,
        credentials: input.credentials,
        cache: input.cache,
        redirect: input.redirect,
        referrer: input.referrer,
        integrity: input.integrity,
      };
    }
  } else {
    url = input.toString();
  }

  const proxyUrl = new URL(PROXY_ENDPOINT, env.NEXT_PUBLIC_PROXY_URL);
  proxyUrl.searchParams.set('url', encodeURIComponent(url));
  proxyUrl.searchParams.set('share_data', 'true');

  const { method = 'GET', ...restInit } = effectiveInit ?? {};
  const normalizedMethod = method.toString().toUpperCase();

  const headers = new Headers(effectiveInit?.headers);

  if (
    normalizedMethod !== 'GET' &&
    normalizedMethod !== 'HEAD' &&
    restInit.body
  ) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }

  // Clear body for GET/HEAD requests
  const finalInit: RequestInit = {
    ...restInit,
    method: normalizedMethod,
    headers,
  };

  if (normalizedMethod === 'GET' || normalizedMethod === 'HEAD') {
    finalInit.body = undefined;
  }

  // Normalize JSON bodies coming through as text/plain (seen when x402 wrapper passes a Request)
  // Also unwrap double-stringified JSON if detected (e.g. "\"{\\\"token\\\":\\\"BTC\\\"}\"")
  if (
    normalizedMethod !== 'GET' &&
    normalizedMethod !== 'HEAD' &&
    typeof finalInit.body === 'string'
  ) {
    const ct = headers.get('content-type') ?? '';
    const bodyText = finalInit.body;

    const tryParse = (s: string): unknown => {
      try {
        return JSON.parse(s) as unknown;
      } catch {
        return undefined;
      }
    };

    const parsedOnce = tryParse(bodyText);
    // If body is a JSON string literal whose contents are JSON, unwrap one layer.
    if (typeof parsedOnce === 'string') {
      const parsedTwice = tryParse(parsedOnce);
      if (parsedTwice !== undefined && typeof parsedTwice === 'object') {
        finalInit.body = parsedOnce;
        headers.set('Content-Type', 'application/json');
        // #region agent log
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        fetch('http://127.0.0.1:7242/ingest/b580f9ca-6e18-4c38-9de1-256e6503a55a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apps/scan/src/lib/x402/proxy-fetch.ts:97',message:'fetchWithProxy unwrapped double-stringified JSON body',data:{prevContentType:ct,newContentType:headers.get('content-type'),bodyPreviewBefore:bodyText.slice(0,120),bodyPreviewAfter:typeof finalInit.body==='string'?finalInit.body.slice(0,120):undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H3'})}).catch(()=>{});
        // #endregion
      }
    } else if (
      parsedOnce !== undefined &&
      typeof parsedOnce === 'object' &&
      (ct.toLowerCase().startsWith('text/plain') || ct === '')
    ) {
      headers.set('Content-Type', 'application/json');
      // #region agent log
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      fetch('http://127.0.0.1:7242/ingest/b580f9ca-6e18-4c38-9de1-256e6503a55a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apps/scan/src/lib/x402/proxy-fetch.ts:110',message:'fetchWithProxy corrected content-type for JSON-looking body',data:{prevContentType:ct,newContentType:headers.get('content-type'),bodyPreview:bodyText.slice(0,120)},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion
    }
  }

  // #region agent log
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  fetch('http://127.0.0.1:7242/ingest/b580f9ca-6e18-4c38-9de1-256e6503a55a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apps/scan/src/lib/x402/proxy-fetch.ts:72',message:'fetchWithProxy before proxy fetch',data:{proxyUrl:proxyUrl.toString().slice(0,200),targetUrl:url.slice(0,200),method:normalizedMethod,finalBodyType:typeof finalInit.body,finalBodyPreview:typeof finalInit.body==='string'?finalInit.body.slice(0,120):undefined,contentType:headers.get('content-type')},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H2'})}).catch(()=>{});
  // #endregion
  return fetch(proxyUrl.toString(), finalInit);
};
