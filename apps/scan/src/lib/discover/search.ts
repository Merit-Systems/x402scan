import { env } from '@/env';

export interface SearchResultEndpoint {
  method: string;
  path: string;
  summary: string;
  authMode?: string;
  price?: string;
}

export interface SearchResult {
  origin: string;
  title: string;
  description: string;
  favicon: string;
  protocols: string[];
  endpoint?: SearchResultEndpoint;
}

// Wire response from /api/external/search/results — see agentcash
// `services/search-v2` and `app/api/_lib/search-route-handlers.ts`.
interface ExternalSearchResultRow {
  resourceId: string;
  method: string;
  path: string;
  title: string;
  facets?: unknown;
  authMode: string | null;
  price: string | null;
  protocols: string[];
  originTitle: string;
  originUrl: string;
  favicon: string;
  x402OriginId: string | null;
  mppOriginId: string | null;
}

interface ExternalSearchResponse {
  query: string;
  latencyMs: number;
  page: number;
  totalResults: number;
  results: ExternalSearchResultRow[];
}

/**
 * Calls AgentCash's external search API (catalog-backed semantic search).
 * Server-to-server only — keep the bearer token off the client.
 */
export async function searchDiscover(query: string): Promise<SearchResult[]> {
  if (!env.AGENTCASH_URL) {
    throw new Error('AGENTCASH_URL is not set');
  }
  if (!env.AGENTCASH_SEARCH_API_KEY) {
    throw new Error('AGENTCASH_SEARCH_API_KEY is not set');
  }

  const url = new URL('/api/external/search/results', env.AGENTCASH_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('protocol', 'x402');
  url.searchParams.set('limit', '20');
  url.searchParams.set('broad', 'true');

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${env.AGENTCASH_SEARCH_API_KEY}`,
    },
  });

  if (!res.ok) {
    throw new Error(`AgentCash search failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as ExternalSearchResponse;

  // The catalog endpoint returns one row per resource (origin × method × path).
  // Both consumers want one row per origin, so collapse here — first hit wins
  // since results are already ranked by relevance.
  const byOrigin = new Map<string, SearchResult>();
  for (const row of data.results ?? []) {
    if (byOrigin.has(row.originUrl)) continue;
    byOrigin.set(row.originUrl, {
      origin: row.originUrl,
      title: row.originTitle || row.originUrl,
      description: '',
      favicon: row.favicon,
      protocols: row.protocols,
      endpoint: {
        method: row.method,
        path: row.path,
        summary: row.title,
        ...(row.authMode != null ? { authMode: row.authMode } : {}),
        ...(row.price != null ? { price: row.price } : {}),
      },
    });
  }

  return Array.from(byOrigin.values());
}
