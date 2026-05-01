import { createHash } from 'crypto';
import superjson from 'superjson';
import type { PaginatedQueryParams } from './pagination';
import { getRedisClient } from './redis';
import { CACHE_DURATION_MINUTES } from './cache-constants';

/**
 * Maximum Redis key length in bytes. Keys exceeding this are hashed to prevent
 * "ERR key too long" errors (e.g. when address lists are serialized into keys).
 */
const MAX_KEY_LENGTH = 1024;

/**
 * Cache context that can be passed from tRPC to control cache behavior
 */
interface CacheContext {
  isWarmingCache?: boolean;
}

/**
 * Redis TTL is 2x the cache duration to provide buffer time.
 * This ensures cache doesn't expire while the next warming cycle is running.
 */
export const CACHE_TTL_SECONDS = CACHE_DURATION_MINUTES * 60 * 2;

/**
 * Lock timeout in seconds. Acts as a safety net — if the holder crashes
 * without releasing, the lock auto-expires after this period.
 */
const LOCK_TIMEOUT_SECONDS = 30;

/**
 * Poll interval in milliseconds when waiting for lock
 */
const POLL_INTERVAL_MS = 100;

/**
 * Max seconds a waiter will poll before giving up and executing directly.
 * Intentionally shorter than LOCK_TIMEOUT_SECONDS so waiters fall through
 * quickly rather than blocking for the full lock TTL.
 */
const MAX_POLL_SECONDS = 10;

const MAX_POLL_ATTEMPTS = Math.floor(
  (MAX_POLL_SECONDS * 1000) / POLL_INTERVAL_MS
);

/**
 * Round a date to the nearest cache interval for stable cache keys
 */
const roundDateToInterval = (date?: Date): string | undefined => {
  if (!date) return undefined;
  const rounded = new Date(date);
  rounded.setMinutes(
    Math.floor(rounded.getMinutes() / CACHE_DURATION_MINUTES) *
      CACHE_DURATION_MINUTES,
    0,
    0
  );
  return rounded.toISOString();
};

/**
 * Serialize data using SuperJSON (handles BigInt, Date, Map, Set, etc.)
 */
const serialize = <T>(data: T): string => {
  return superjson.stringify(data);
};

/**
 * Deserialize data using SuperJSON
 */
const deserialize = <T>(str: string): T => {
  return superjson.parse<T>(str);
};

/**
 * Serialize dates in an object to ISO strings for JSON serialization
 */
const serializeDates = <T>(obj: T, dateKeys: (keyof T)[]): T => {
  const result = { ...obj };
  for (const key of dateKeys) {
    if (result[key] instanceof Date) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      result[key] = (result[key] as Date).toISOString() as any;
    }
  }
  return result;
};

/**
 * Deserialize ISO strings back to Date objects
 */
const deserializeDates = <T>(obj: T, dateKeys: (keyof T)[]): T => {
  const result = { ...obj };
  for (const key of dateKeys) {
    if (typeof result[key] === 'string') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      result[key] = new Date(result[key] as string) as any;
    }
  }
  return result;
};

/**
 * Sleep utility for polling
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Redis-based cached query with distributed locking.
 *
 * Guarantees:
 *  - At most one concurrent execution of queryFn per cache key.
 *  - If the lock holder crashes (e.g. Vercel function timeout), waiters
 *    detect the orphaned lock and fall through to execute directly.
 *  - Never throws due to lock contention — always falls back to a direct
 *    query execution.
 */
async function withRedisCache<T>(
  fullCacheKey: string,
  queryFn: () => Promise<T>,
  ttlSeconds: number,
  forceRefresh = false
): Promise<T> {
  const redis = getRedisClient();
  if (!redis) {
    console.log(
      `[Cache] NO REDIS: Executing query directly for ${fullCacheKey}`
    );
    return await queryFn();
  }

  const lockKey = `${fullCacheKey}:lock`;

  // On force-refresh (cache warming), skip the cache so we actually
  // re-execute and extend the TTL, preventing expiry between warming cycles.
  if (!forceRefresh) {
    try {
      const cached = await redis.get(fullCacheKey);
      if (cached) {
        console.log(`[Cache] HIT: ${fullCacheKey}`);
        return deserialize<T>(cached);
      }
    } catch {
      // Redis read failed — fall through to execute
    }
  }

  // Try to acquire lock (NX = set-if-not-exists, EX = auto-expire)
  const lockAcquired = await redis.set(
    lockKey,
    Date.now().toString(),
    'EX',
    LOCK_TIMEOUT_SECONDS,
    'NX'
  );

  if (lockAcquired === 'OK') {
    console.log(
      `[Cache] ${forceRefresh ? 'WARMING' : 'MISS'}: Executing query for ${fullCacheKey}`
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
    `[Cache] WAIT: Polling for ${fullCacheKey} (max ${MAX_POLL_SECONDS}s)`
  );
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    await sleep(POLL_INTERVAL_MS);

    try {
      const cached = await redis.get(fullCacheKey);
      if (cached) {
        console.log(
          `[Cache] WAIT→HIT after ${(i + 1) * POLL_INTERVAL_MS}ms: ${fullCacheKey}`
        );
        return deserialize<T>(cached);
      }

      // Detect orphaned lock: if the lock disappeared but no result was
      // cached, the holder crashed. Break out and execute directly.
      const lockExists = await redis.exists(lockKey);
      if (!lockExists) {
        console.log(
          `[Cache] WAIT→ORPHAN: Lock gone without result after ${(i + 1) * POLL_INTERVAL_MS}ms`
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

/**
 * Core cached query wrapper with custom serialization/deserialization
 */
const createCachedQueryBase = <TInput extends unknown[], TOutput>(config: {
  queryFn: (...args: TInput) => Promise<TOutput>;
  cacheKeyPrefix: string;
  createCacheKey: (...args: TInput) => string;
  serialize: (data: TOutput) => TOutput;
  deserialize: (data: TOutput) => TOutput;
  revalidate?: number;
  tags?: string[];
}) => {
  return async (...allArgs: [...TInput, CacheContext?]): Promise<TOutput> => {
    // Extract context from last argument if present
    const lastArg = allArgs[allArgs.length - 1];
    const hasContext =
      lastArg && typeof lastArg === 'object' && 'isWarmingCache' in lastArg;

    const ctx = hasContext ? (lastArg as CacheContext) : {};
    const args = hasContext
      ? (allArgs.slice(0, -1) as TInput)
      : (allArgs as unknown as TInput);

    const cacheKey = config.createCacheKey(...args);
    const rawKey = `${config.cacheKeyPrefix}:${cacheKey}`;
    // Hash oversized keys to prevent Redis "ERR key too long" errors.
    // Preserves the prefix for debuggability.
    const fullCacheKey =
      rawKey.length > MAX_KEY_LENGTH
        ? `${config.cacheKeyPrefix}:hash:${createHash('sha256').update(rawKey).digest('hex')}`
        : rawKey;
    const ttl = config.revalidate ?? CACHE_TTL_SECONDS;

    return await withRedisCache(
      fullCacheKey,
      async () => {
        const data = await config.queryFn(...args);
        return config.serialize(data);
      },
      ttl,
      ctx.isWarmingCache
    ).then(result => config.deserialize(result));
  };
};

/**
 * Generic cached query wrapper for single items with dates
 */
export const createCachedQuery = <TInput extends unknown[], TOutput>(config: {
  queryFn: (...args: TInput) => Promise<TOutput>;
  cacheKeyPrefix: string;
  createCacheKey: (...args: TInput) => string;
  dateFields: (keyof NonNullable<TOutput>)[];
  revalidate?: number;
  tags?: string[];
}) => {
  return createCachedQueryBase({
    ...config,
    serialize: data =>
      serializeDates(data as NonNullable<TOutput>, config.dateFields),
    deserialize: data =>
      deserializeDates(data as NonNullable<TOutput>, config.dateFields),
  });
};

/**
 * Generic cached query wrapper for arrays of items with dates
 */
export const createCachedArrayQuery = <
  TInput extends unknown[],
  TItem,
>(config: {
  queryFn: (...args: TInput) => Promise<TItem[]>;
  cacheKeyPrefix: string;
  createCacheKey: (...args: TInput) => string;
  dateFields: (keyof TItem)[];
  revalidate?: number;
  tags?: string[];
}) => {
  return createCachedQueryBase({
    ...config,
    serialize: data =>
      data.map(item => serializeDates(item, config.dateFields)),
    deserialize: data =>
      data.map(item => deserializeDates(item, config.dateFields)),
  });
};

/**
 * Base response shape for paginated queries (items + hasNextPage + page)
 */
interface BasePaginatedResponse<TItem> {
  items: TItem[];
  hasNextPage: boolean;
  page: number;
}

/**
 * Generic cached query wrapper for paginated responses with dates.
 * Works with both PaginatedResponse (with total_count/total_pages) and
 * PeekAheadResponse (without counts) - preserves the exact return type.
 */
export const createCachedPaginatedQuery = <
  TInput,
  TItem extends Record<string, unknown>,
  TResponse extends BasePaginatedResponse<TItem>,
>(config: {
  queryFn: (
    input: TInput,
    pagination: PaginatedQueryParams
  ) => Promise<TResponse>;
  cacheKeyPrefix: string;
  createCacheKey: (input: TInput) => string;
  dateFields: (keyof TItem)[];
  revalidate?: number;
  tags?: string[];
}) => {
  return createCachedQueryBase({
    ...config,
    serialize: (data: TResponse): TResponse => ({
      ...data,
      items: data.items.map(item => serializeDates(item, config.dateFields)),
    }),
    deserialize: (data: TResponse): TResponse => ({
      ...data,
      items: data.items.map(item => deserializeDates(item, config.dateFields)),
    }),
    createCacheKey: (input, pagination) =>
      config.createCacheKey({
        ...input,
        page: pagination.page,
        page_size: pagination.page_size,
      }),
  });
};

/**
 * Create a standardized cache key from input parameters
 * Handles date rounding and array sorting automatically
 */
export const createStandardCacheKey = (
  params: Record<string, unknown>
): string => {
  const normalized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) {
      // Skip undefined values
      continue;
    } else if (value instanceof Date) {
      // Round dates to nearest cache interval
      normalized[key] = roundDateToInterval(value);
    } else if (Array.isArray(value)) {
      // Sort arrays for consistent keys
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      normalized[key] = [...value].sort();
    } else if (typeof value === 'object' && value !== null) {
      // Recursively normalize nested objects
      normalized[key] = createStandardCacheKey(
        value as Record<string, unknown>
      );
    } else {
      normalized[key] = value;
    }
  }

  return JSON.stringify(
    Object.keys(normalized)
      .sort()
      .reduce(
        (obj, key) => {
          obj[key] = normalized[key];
          return obj;
        },
        {} as Record<string, unknown>
      )
  );
};
