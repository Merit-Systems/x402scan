import { env } from '@/env';

const PROXY_ENDPOINT = '/api/proxy' as const;

export const fetchWithProxy = async (
  input: URL | RequestInfo,
  requestInit?: RequestInit
) => {
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

  const bodyString =
    typeof restInit.body === 'string' ? restInit.body.trim() : undefined;
  const looksLikeJson =
    typeof bodyString === 'string' &&
    bodyString.length > 0 &&
    ((bodyString.startsWith('{') && bodyString.endsWith('}')) ||
      (bodyString.startsWith('[') && bodyString.endsWith(']')));

  if (
    normalizedMethod !== 'GET' &&
    normalizedMethod !== 'HEAD' &&
    restInit.body
  ) {
    const ct = headers.get('Content-Type');
    // Some wrappers (e.g. payment wrappers) default string bodies to text/plain.
    // If we are sending JSON, force application/json so upstream body parsers run.
    if (!ct || ct.toLowerCase().startsWith('text/plain')) {
      if (looksLikeJson) {
        headers.set('Content-Type', 'application/json');
      } else if (!ct) {
        headers.set('Content-Type', 'application/json');
      }
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

  return fetch(proxyUrl.toString(), finalInit);
};
