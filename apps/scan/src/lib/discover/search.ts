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

/**
 * Calls agentcash.dev/api/internal/search for semantic search.
 * Falls back to empty results if the endpoint is unavailable.
 */
import { env } from '@/env';

export async function searchDiscover(query: string): Promise<SearchResult[]> {
  if (!env.AGENTCASH_URL) {
    throw new Error('AGENTCASH_URL is not set');
  }

  const res = await fetch(`${env.AGENTCASH_URL}/api/internal/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(env.AGENTCASH_INTERNAL_API_KEY
        ? { Authorization: `Bearer ${env.AGENTCASH_INTERNAL_API_KEY}` }
        : {}),
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    throw new Error(
      `AgentCash search failed: ${res.status} ${res.statusText}`
    );
  }

  const data = (await res.json()) as { results: SearchResult[] };
  return data.results ?? [];
}
