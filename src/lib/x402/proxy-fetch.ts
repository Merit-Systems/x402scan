import { env } from '@/env';

const PROXY_ENDPOINT = '/api/proxy' as const;

export const fetchWithProxy = async (
  input: URL | RequestInfo,
  requestInit?: RequestInit
) => {
  let url: string;
  if (input instanceof Request) {
    url = input.url;
  } else {
    url = input.toString();
  }
  const proxyUrl = new URL(PROXY_ENDPOINT, env.NEXT_PUBLIC_APP_URL);
  proxyUrl.searchParams.set('url', encodeURIComponent(url));
  proxyUrl.searchParams.set('share_data', 'true');

  const { method = 'GET', ...restInit } = requestInit ?? {};
  const normalizedMethod = method.toString().toUpperCase();

  const headers = new Headers(requestInit?.headers);

  // Auto-add Content-Type for requests with body
  if (
    normalizedMethod !== 'GET' &&
    normalizedMethod !== 'HEAD' &&
    restInit.body
  ) {
    headers.set('Content-Type', 'application/json');
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
