import { neon } from '@neondatabase/serverless';
import { env } from '@/env';
import { CACHE_TTL_SECONDS } from '@/lib/cache';
import { getRedisClient } from '@/lib/redis';

function getAgentCashSql() {
  if (!env.AGENTCASH_DATABASE_URL) return null;
  const connectionUrl = env.AGENTCASH_DATABASE_URL.replace(
    /[&?]channel_binding=[^&]*/,
    ''
  );
  return neon(connectionUrl);
}

const CACHE_KEY = 'discover:origins:all';

const getDiscoverOriginsUncached = async (): Promise<string[]> => {
  const sql = getAgentCashSql();
  if (!sql) {
    console.warn(
      '[discover] AGENTCASH_DATABASE_URL not set, discover page will be empty'
    );
    return [];
  }

  const t0 = performance.now();
  const rows = (await sql`
    SELECT origin, protocols
    FROM search_index
    WHERE 'x402' = ANY(protocols)
    ORDER BY position ASC
  `) as { origin: string; protocols: string[] }[];
  console.log(
    `[discover] getDiscoverOrigins=${(performance.now() - t0).toFixed(0)}ms (${rows.length} origins)`
  );

  return rows.map(row => String(row.origin));
};

/**
 * Fetches tier-1 x402 origin URLs from the agent-cash search index.
 * Cached in Redis for the standard cache duration.
 */
export const getDiscoverOrigins = async (): Promise<string[]> => {
  const redis = getRedisClient();
  if (redis) {
    const cached = await redis.get(CACHE_KEY).catch(() => null);
    if (cached) {
      console.log(`[Cache] HIT: ${CACHE_KEY}`);
      return JSON.parse(cached) as string[];
    }
  }

  const result = await getDiscoverOriginsUncached();

  if (redis) {
    await redis
      .setex(CACHE_KEY, CACHE_TTL_SECONDS, JSON.stringify(result))
      .catch(() => {
        /* cache write is best-effort */
      });
  }

  return result;
};
