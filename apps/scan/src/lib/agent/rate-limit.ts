import { getRedisClient } from '@/lib/redis';
import { RATE_LIMIT } from '@/lib/agent/rate-limit-policy';

/**
 * Fixed-window, per-client rate limiting for the public REST API, exposing the
 * IETF RateLimit header fields (draft-ietf-httpapi-ratelimit-headers):
 *
 *   RateLimit-Policy: "default";q=120;w=60
 *   RateLimit:        "default";r=119;t=42
 *
 * plus the de-facto `X-RateLimit-*` aliases and `Retry-After` on 429.
 *
 * Counts live in Redis when configured (shared across instances) and fall
 * back to a per-process map otherwise. The fallback is deliberately lenient:
 * an agent hitting several instances may get a slightly higher effective
 * limit, never a lower one.
 */

export interface RateLimitResult {
  limited: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the current window resets. */
  resetSeconds: number;
}

interface Store {
  /** Increment the counter for `key` and return the new value. */
  increment(key: string, windowSeconds: number): Promise<number>;
}

const memoryCounters = new Map<string, { count: number; expiresAt: number }>();

const memoryStore: Store = {
  increment(key, windowSeconds) {
    const now = Date.now();
    const entry = memoryCounters.get(key);
    if (!entry || entry.expiresAt <= now) {
      memoryCounters.set(key, {
        count: 1,
        expiresAt: now + windowSeconds * 1000,
      });
      // Opportunistic cleanup so the map can't grow without bound.
      if (memoryCounters.size > 10_000) {
        for (const [k, v] of memoryCounters) {
          if (v.expiresAt <= now) memoryCounters.delete(k);
        }
      }
      return Promise.resolve(1);
    }
    entry.count += 1;
    return Promise.resolve(entry.count);
  },
};

function redisStore(): Store | null {
  const redis = getRedisClient();
  if (!redis) return null;
  return {
    async increment(key, windowSeconds) {
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, windowSeconds);
      return count;
    },
  };
}

function currentWindow(nowMs: number) {
  const windowMs = RATE_LIMIT.windowSeconds * 1000;
  const start = Math.floor(nowMs / windowMs) * windowMs;
  return {
    id: start / windowMs,
    resetSeconds: Math.max(1, Math.ceil((start + windowMs - nowMs) / 1000)),
  };
}

/** Best-effort client identifier: first hop of X-Forwarded-For, else a shared bucket. */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip =
    forwarded?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip')?.trim() ??
    'anonymous';
  return ip;
}

export async function checkRateLimit(
  client: string,
  nowMs = Date.now(),
  storeOverride?: Store
): Promise<RateLimitResult> {
  const { id, resetSeconds } = currentWindow(nowMs);
  const key = `ratelimit:api:${client}:${id}`;
  const store = storeOverride ?? redisStore() ?? memoryStore;

  let count: number;
  try {
    count = await store.increment(key, RATE_LIMIT.windowSeconds + 1);
  } catch (error) {
    // A broken store must never take the API down: fail open.
    console.error('[rate-limit] store error, failing open:', error);
    count = 1;
  }

  return {
    limited: count > RATE_LIMIT.limit,
    limit: RATE_LIMIT.limit,
    remaining: Math.max(0, RATE_LIMIT.limit - count),
    resetSeconds,
  };
}

export function rateLimitHeaders(result: RateLimitResult) {
  return {
    'RateLimit-Policy': `"${RATE_LIMIT.policyName}";q=${result.limit};w=${RATE_LIMIT.windowSeconds}`,
    RateLimit: `"${RATE_LIMIT.policyName}";r=${result.remaining};t=${result.resetSeconds}`,
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetSeconds),
    ...(result.limited && { 'Retry-After': String(result.resetSeconds) }),
  };
}

/** Test seam: reset the in-process fallback store. */
export function resetMemoryRateLimitStore() {
  memoryCounters.clear();
}
