export interface SearchResult {
  origin: string;
  title: string;
  description: string;
  favicon: string;
  protocols: string[];
}

/**
 * Calls agentcash.dev/api/internal/search for semantic search.
 * Falls back to empty results if the endpoint is unavailable.
 */
import { env } from '@/env';

export async function searchDiscover(
  query: string
): Promise<SearchResult[]> {
  try {
    const baseUrl =
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : 'https://agentcash.dev';

    const res = await fetch(`${baseUrl}/api/internal/search`, {
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
      console.error(`[discover-search] ${baseUrl} returned ${res.status}`);
      return [];
    }

    const data = (await res.json()) as { results: SearchResult[] };
    console.log(`[discover-search] ${data.results?.length ?? 0} results for "${query}"`);
    return data.results ?? [];
  } catch (e) {
    console.error('[discover-search] failed:', e);
    return [];
  }
}
