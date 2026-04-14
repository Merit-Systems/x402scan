import { neon } from '@neondatabase/serverless';
import { env } from '@/env';

interface SearchIndexRow {
  origin: string;
  protocols: string[];
}

/**
 * Fetches tier-1 x402 origin URLs from the agent-cash search index.
 * Filters to only include origins that support the x402 protocol.
 */
export const getDiscoverOrigins = async (): Promise<string[]> => {
  if (!env.AGENTCASH_DATABASE_URL) {
    console.warn(
      '[discover] AGENTCASH_DATABASE_URL not set, discover page will be empty'
    );
    return [];
  }

  // Remove channel_binding param which isn't supported by the HTTP transport
  const connectionUrl = env.AGENTCASH_DATABASE_URL.replace(
    /[&?]channel_binding=[^&]*/,
    ''
  );
  const sql = neon(connectionUrl);

  const rows = (await sql`
    SELECT origin, protocols
    FROM search_index
    WHERE 'x402' = ANY(protocols)
    ORDER BY position ASC
  `) as SearchIndexRow[];

  return rows.map(row => row.origin);
};
