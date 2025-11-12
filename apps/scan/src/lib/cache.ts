import superjson from 'superjson';
import type { PaginatedQueryParams, PaginatedResponse } from './pagination';
import { getRedisClient } from './redis';
import { CACHE_DURATION_MINUTES } from './cache-constants';

/**
 * Cache context that can be passed from tRPC to control cache behavior
 */
interface CacheContext {
  isWarmingCache?: boolean;
}

/**
 * Redis TTL is 3x the cache duration to provide buffer time.
 * This ensures cache doesn't expire while the next warming cycle is running.
 */
// TODO(sragss): With unwramed queries they'll be cached by 45mins.
const CACHE_TTL_SECONDS = CACHE_DURATION_MINUTES * 60 * 2;

/**
 * Lock timeout in seconds (query should complete within this time)
 */
const LOCK_TIMEOUT_SECONDS = 60;

/**
 * Poll interval in milliseconds when waiting for lock
 */
const POLL_INTERVAL_MS = 100;

/**
 * Max polling attempts (derived from lock timeout and poll interval)
 */
const MAX_POLL_ATTEMPTS = Math.floor(
  (LOCK_TIMEOUT_SECONDS * 1000) / POLL_INTERVAL_MS
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
 * Redis-based cached query with distributed locking
 */
async function withRedisCache<T>(
  fullCacheKey: string,
  queryFn: () => Promise<T>,
  ttlSeconds: number,
  forceRefresh = false
): Promise<T> {
  const redis = getRedisClient();
  if (!redis) {
    throw new Error('Redis client not available');
  }

  const lockKey = `${fullCacheKey}:lock`;

  // Try to get from cache first
  const cached = await redis.get(fullCacheKey);
  if (cached) {
    console.log(`[Cache] HIT: ${fullCacheKey}`);
    return deserialize<T>(cached);
  }

  // Try to acquire lock with NX (set if not exists) and EX (expiry)
  const lockAcquired = await redis.set(
    lockKey,
    '1',
    'EX',
    LOCK_TIMEOUT_SECONDS,
    'NX'
  );

  if (lockAcquired === 'OK') {
    // We got the lock - execute query and cache result
    if (forceRefresh) {
      console.log(`[Cache] WARMING: ${fullCacheKey}`);
    } else {
      console.log(`[Cache] MISS: Executing query for ${fullCacheKey}`);
    }
    try {
      const result = await queryFn();
      await redis.setex(fullCacheKey, ttlSeconds, serialize(result));
      return result;
    } finally {
      // Release lock
      await redis.del(lockKey);
    }
  } else {
    // Someone else has the lock - poll for the cached result
    if (forceRefresh) {
      console.log(`[Cache] WARMING (waiting for lock): ${fullCacheKey}`);
    } else {
      console.log(`[Cache] WAIT: Polling for ${fullCacheKey}`);
    }
    for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
      await sleep(POLL_INTERVAL_MS);
      const cached = await redis.get(fullCacheKey);
      if (cached) {
        console.log(
          `[Cache] WAIT SUCCESS: Got result after ${(i + 1) * POLL_INTERVAL_MS}ms`
        );
        return deserialize<T>(cached);
      }
    }

    throw new Error('Cache lock timeout - query took too long');
  }
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
    const fullCacheKey = `${config.cacheKeyPrefix}:${cacheKey}`;
    const ttl = config.revalidate ?? CACHE_TTL_SECONDS;

    const redis = getRedisClient();
    if (!redis) {
      throw new Error('Redis client not available');
    }

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
 * Generic cached query wrapper for paginated responses with dates
 */
export const createCachedPaginatedQuery = <
  TInput,
  TItem extends Record<string, unknown>,
>(config: {
  queryFn: (
    input: TInput,
    pagination: PaginatedQueryParams
  ) => Promise<PaginatedResponse<TItem>>;
  cacheKeyPrefix: string;
  createCacheKey: (input: TInput) => string;
  dateFields: (keyof TItem)[];
  revalidate?: number;
  tags?: string[];
}) => {
  return createCachedQueryBase({
    ...config,
    serialize: data => ({
      ...data,
      items: data.items.map(item => serializeDates(item, config.dateFields)),
    }),
    deserialize: data => ({
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
