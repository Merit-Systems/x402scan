// Copied from the pre-migration cache wrapper on json/use-brand-fonts-and-allow-zoom.
// Lock/poll/fallback semantics retained. Missing Redis fails instead of silently
// becoming an uncached test. Only isolated cache-benchmark:v1:* keys are used.
import { parse, stringify } from "superjson";

import { getRedisClient } from "@/lib/redis";

const LOCK_TIMEOUT_SECONDS = 30;
const POLL_INTERVAL_MS = 100;
const MAX_POLL_SECONDS = 10;
const MAX_POLL_ATTEMPTS = 100;
const serialize = stringify;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function withRedisCache<T>(
  fullCacheKey: string,
  queryFn: () => Promise<T>,
  ttlSeconds: number,
  forceRefresh = false
): Promise<T> {
  const redis = getRedisClient();
  if (!redis) throw new Error("Benchmark requires Redis");

  const lockKey = `${fullCacheKey}:lock`;

  // On force-refresh (cache warming), skip the cache so we actually
  // re-execute and extend the TTL, preventing expiry between warming cycles.
  if (!forceRefresh) {
    try {
      const cached = await redis.get(fullCacheKey);
      if (cached) {
        console.log(`[Cache] HIT: ${fullCacheKey}`);
        return parse<T>(cached);
      }
    } catch {
      // Redis read failed — fall through to execute
    }
  }

  // Try to acquire lock (NX = set-if-not-exists, EX = auto-expire)
  const lockAcquired = await redis.set(
    lockKey,
    Date.now().toString(),
    "EX",
    LOCK_TIMEOUT_SECONDS,
    "NX"
  );

  if (lockAcquired === "OK") {
    console.log(
      `[Cache] ${forceRefresh ? "WARMING" : "MISS"}: Executing query for ${fullCacheKey}`
    );
    try {
      const result = await queryFn();
      await redis.setex(fullCacheKey, ttlSeconds, serialize(result));
      return result;
    } finally {
      await redis.del(lockKey).catch(() => {
        /* lock cleanup is best-effort */
      });
    }
  }

  // Another process holds the lock — poll for result
  console.log(
    `[Cache] WAIT: Polling for ${fullCacheKey} (max ${String(MAX_POLL_SECONDS)}s)`
  );
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    await sleep(POLL_INTERVAL_MS);

    try {
      const cached = await redis.get(fullCacheKey);
      if (cached) {
        console.log(
          `[Cache] WAIT→HIT after ${String((i + 1) * POLL_INTERVAL_MS)}ms: ${fullCacheKey}`
        );
        return parse<T>(cached);
      }

      // Detect orphaned lock: if the lock disappeared but no result was
      // cached, the holder crashed. Break out and execute directly.
      const lockExists = await redis.exists(lockKey);
      if (!lockExists) {
        console.log(
          `[Cache] WAIT→ORPHAN: Lock gone without result after ${String((i + 1) * POLL_INTERVAL_MS)}ms`
        );
        break;
      }
    } catch {
      // Redis error during poll — break out and execute directly
      break;
    }
  }

  // Fallback: execute query directly instead of throwing.
  // This ensures requests never fail due to lock contention alone.
  console.warn(
    `[Cache] FALLBACK: Executing query directly for ${fullCacheKey}`
  );
  const result = await queryFn();
  await redis.setex(fullCacheKey, ttlSeconds, serialize(result)).catch(() => {
    /* cache write is best-effort */
  });
  return result;
}
