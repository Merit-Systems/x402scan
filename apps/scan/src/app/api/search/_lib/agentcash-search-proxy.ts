import { NextResponse } from 'next/server';

import { env } from '@/env';

type ExternalSearchPath =
  | '/api/external/search/autocomplete'
  | '/api/external/search/results'
  | '/api/external/search/events/feedback'
  | '/api/external/search/events/selection';

interface AgentCashProxyInit extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>;
  next?: {
    revalidate: number;
  };
}

const forwardedResponseHeaders = ['content-type', 'cache-control'] as const;

function missingApiKeyResponse() {
  return NextResponse.json(
    { error: 'AgentCash search API key is not configured.' },
    {
      status: 503,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}

function buildExternalUrl(
  request: Request,
  path: ExternalSearchPath,
  allowedParams: readonly string[]
) {
  const incomingUrl = new URL(request.url);
  const externalUrl = new URL(path, env.AGENTCASH_SEARCH_API_URL);

  for (const param of allowedParams) {
    const value = incomingUrl.searchParams.get(param);
    if (value !== null) {
      externalUrl.searchParams.set(param, value);
    }
  }

  return externalUrl;
}

function responseHeadersFrom(response: Response) {
  const headers = new Headers();

  for (const header of forwardedResponseHeaders) {
    const value = response.headers.get(header);
    if (value) headers.set(header, value);
  }

  return headers;
}

async function proxyAgentCashRequest(url: URL, init: AgentCashProxyInit) {
  if (!env.AGENTCASH_SEARCH_API_KEY) {
    return missingApiKeyResponse();
  }

  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${env.AGENTCASH_SEARCH_API_KEY}`,
      },
    });

    return new Response(await response.text(), {
      status: response.status,
      headers: responseHeadersFrom(response),
    });
  } catch (error) {
    console.error('AgentCash search proxy failed', {
      path: url.pathname,
      error,
    });
    return NextResponse.json(
      { error: 'AgentCash search is temporarily unavailable.' },
      {
        status: 502,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}

export function proxyAgentCashSearchGet({
  allowedParams,
  path,
  request,
}: {
  allowedParams: readonly string[];
  path: ExternalSearchPath;
  request: Request;
}) {
  const externalUrl = buildExternalUrl(request, path, allowedParams);
  return proxyAgentCashRequest(externalUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    next: { revalidate: 0 },
  });
}

export async function proxyAgentCashSearchPost({
  path,
  request,
}: {
  path: ExternalSearchPath;
  request: Request;
}) {
  const body = await request.text();

  return proxyAgentCashRequest(new URL(path, env.AGENTCASH_SEARCH_API_URL), {
    method: 'POST',
    body,
    headers: {
      'Content-Type': request.headers.get('content-type') ?? 'application/json',
    },
  });
}
