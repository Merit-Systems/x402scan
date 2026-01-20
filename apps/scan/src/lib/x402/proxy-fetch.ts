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

  return fetch(proxyUrl.toString(), finalInit);
};
