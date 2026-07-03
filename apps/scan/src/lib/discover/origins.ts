import { env } from '@/env';
import { CACHE_TTL_SECONDS } from '@/lib/cache';
import { getRedisClient } from '@/lib/redis';

const PROTOCOL = 'x402';
const CACHE_KEY = 'discover:origins:catalog:v1';
/** Long-lived fallback so a transient AgentCash outage doesn't wipe the list */
const STALE_CACHE_KEY = 'discover:origins:catalog:v1:stale';
const STALE_TTL_SECONDS = 86400; // 24 hours

/**
 * Calls AgentCash's internal used-origins endpoint. Returns the ordered list
 * of catalog-used origins for this protocol, ranked by the same trust-weighted
 * score catalog search uses.
 *
 * Returns null on any failure (missing env, non-200, fetch error, malformed
 * payload).
 */
export const fetchUsedOriginsFromAgentCash = async (
  protocol: string
): Promise<string[] | null> => {
  if (!env.AGENTCASH_URL || !env.AGENTCASH_INTERNAL_API_KEY) {
    return null;
  }

  let res: Response;
  try {
    const url = new URL(
      '/api/internal/catalog/used-origins',
      env.AGENTCASH_URL
    );
    url.searchParams.set('protocol', protocol);
    res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${env.AGENTCASH_INTERNAL_API_KEY}`,
      },
    });
  } catch (error) {
    console.warn('[discover] AgentCash used-origins fetch failed:', error);
    return null;
  }

  if (!res.ok) {
    console.warn(`[discover] AgentCash used-origins returned ${res.status}`);
    return null;
  }

  let payload: unknown;
  try {
    payload = await res.json();
  } catch (error) {
    console.warn(
      '[discover] AgentCash used-origins returned invalid JSON:',
      error
    );
    return null;
  }

  if (
    !payload ||
    typeof payload !== 'object' ||
    !Array.isArray((payload as { origins?: unknown }).origins) ||
    !(payload as { origins: unknown[] }).origins.every(
      o => typeof o === 'string'
    )
  ) {
    console.warn('[discover] AgentCash used-origins response malformed');
    return null;
  }

  return (payload as { origins: string[] }).origins;
};

const getDiscoverOriginsUncached = async (): Promise<string[]> => {
  const t0 = performance.now();
  const origins = await fetchUsedOriginsFromAgentCash(PROTOCOL);
  console.log(
    `[discover] getDiscoverOrigins=${(performance.now() - t0).toFixed(0)}ms (${origins?.length ?? 0} origins)`
  );
  return origins ?? [];
};

/**
 * Fetches the prioritized list of catalog-used x402 origins from AgentCash's
 * internal `/api/internal/catalog/used-origins` endpoint, ordered by the
 * trust-weighted usage signal. Returns an empty list if the endpoint is
 * unavailable or misconfigured. Cached in Redis.
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
    if (result.length > 0) {
      await Promise.all([
        redis.setex(CACHE_KEY, CACHE_TTL_SECONDS, JSON.stringify(result)),
        redis.setex(STALE_CACHE_KEY, STALE_TTL_SECONDS, JSON.stringify(result)),
      ]).catch(() => {
        /* cache write is best-effort */
      });
    } else {
      // AgentCash returned empty — serve stale data rather than nothing
      const stale = await redis.get(STALE_CACHE_KEY).catch(() => null);
      if (stale) {
        console.warn(
          '[discover] AgentCash returned empty, using stale fallback'
        );
        return JSON.parse(stale) as string[];
      }
    }
  }

  return result;
};
