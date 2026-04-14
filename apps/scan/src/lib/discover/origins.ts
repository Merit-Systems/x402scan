import { neon } from '@neondatabase/serverless';
import { env } from '@/env';

function getAgentCashSql() {
  if (!env.AGENTCASH_DATABASE_URL) return null;
  const connectionUrl = env.AGENTCASH_DATABASE_URL.replace(
    /[&?]channel_binding=[^&]*/,
    ''
  );
  return neon(connectionUrl);
}

/**
 * Fetches tier-1 x402 origin URLs from the agent-cash search index.
 * Filters to only include origins that support the x402 protocol.
 */
export const getDiscoverOrigins = async (): Promise<string[]> => {
  const sql = getAgentCashSql();
  if (!sql) {
    console.warn(
      '[discover] AGENTCASH_DATABASE_URL not set, discover page will be empty'
    );
    return [];
  }

  const rows = (await sql`
    SELECT origin, protocols
    FROM search_index
    WHERE 'x402' = ANY(protocols)
    ORDER BY position ASC
  `) as { origin: string; protocols: string[] }[];

  return rows.map(row => row.origin);
};
