import { createHash } from 'crypto';
import superjson from 'superjson';
import { z } from 'zod';
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
 * Detects a trailing CacheContext argument. The producer (tRPC context)
 * always supplies `isWarmingCache` as a boolean, which distinguishes the
 * context object from ordinary query arguments.
 */
const cacheContextSchema = z.looseObject({
  isWarmingCache: z.boolean(),
});

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
 * Serialize dates in an object to ISO strings for JSON serialization.
 * The wire object intentionally keeps the caller's type: deserializeDates
 * restores the Date fields before the value is handed back to consumers.
 */
const serializeDates = <T>(obj: T, dateKeys: (keyof T)[]): T => {
  const serialized: Partial<Record<keyof T, string>> = {};
  for (const key of dateKeys) {
    const value = obj[key];
    if (value instanceof Date) {
      serialized[key] = value.toISOString();
    }
  }
  return { ...obj, ...serialized };
};

const dateWireStringSchema = z.string();

/**
 * Deserialize ISO strings back to Date objects
 */
const deserializeDates = <T>(obj: T, dateKeys: (keyof T)[]): T => {
  const revived: Partial<Record<keyof T, Date>> = {};
  for (const key of dateKeys) {
    const parsed = dateWireStringSchema.safeParse(obj[key]);
    if (parsed.success) {
      revived[key] = new Date(parsed.data);
    }
  }
  return { ...obj, ...revived };
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
    const contextParse = cacheContextSchema.safeParse(
      allArgs[allArgs.length - 1]
    );
    const ctx: CacheContext = contextParse.success ? contextParse.data : {};
    // TS cannot re-derive TInput from the variadic [...TInput, CacheContext?]
    // tuple after slicing, so this is asserted once here.
    const args = (
      contextParse.success ? allArgs.slice(0, -1) : allArgs.slice()
    ) as TInput;

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
  TItem extends object,
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
 * Values that can appear in cache-key input params: JSON primitives plus
 * Dates, undefined (skipped), and nested arrays/objects of the same.
 */
type CacheKeyParamValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Date
  | readonly CacheKeyParamValue[]
  | { readonly [key: string]: CacheKeyParamValue };

/**
 * Narrow a param value to a nested params object. Only sound after Date and
 * array values have been handled — the remaining non-primitive member of
 * CacheKeyParamValue is the nested object.
 */
const isNestedParams = (
  value: CacheKeyParamValue
): value is Readonly<Record<string, CacheKeyParamValue>> =>
  value instanceof Object;

/**
 * Typed Array.isArray: the builtin predicate narrows a readonly-array union
 * member to `any[]`, discarding the element type.
 */
const isParamArray = (
  value: CacheKeyParamValue
): value is readonly CacheKeyParamValue[] => Array.isArray(value);

const normalizeCacheKeyValue = (
  value: CacheKeyParamValue
): CacheKeyParamValue => {
  if (value instanceof Date) {
    // Round dates to nearest cache interval
    return roundDateToInterval(value);
  }
  if (isParamArray(value)) {
    // Sort arrays for consistent keys; explicit comparator replicates the
    // default UTF-16 string ordering without locale sensitivity. Object
    // elements stringifying to '[object Object]' matches the previous
    // default-sort behavior, so existing cache keys are preserved.
    /* oxlint-disable typescript/no-base-to-string */
    return [...value].sort((a, b) =>
      String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0
    );
    /* oxlint-enable typescript/no-base-to-string */
  }
  if (isNestedParams(value)) {
    // Recursively normalize nested objects
    return createStandardCacheKey(value);
  }
  return value;
};

/**
 * Create a standardized cache key from input parameters
 * Handles date rounding and array sorting automatically.
 *
 * Generic passthrough: callers hand in their own params object (query inputs,
 * Prisma where clauses, ...) and every entry is normalized through
 * CacheKeyParamValue before being serialized.
 */
// Object.entries on a generic param object yields `any` values; this is the
// one place caller-owned params enter the cache-key domain, so the entries are
// asserted into it here rather than at every use site.
const cacheKeyEntries = <T extends object>(
  params: T
): [string, CacheKeyParamValue | undefined][] =>
  Object.entries(params) as [string, CacheKeyParamValue | undefined][];

export const createStandardCacheKey = <T extends object>(params: T): string => {
  const normalized: Record<string, CacheKeyParamValue> = {};

  for (const [key, value] of cacheKeyEntries(params)) {
    if (value === undefined) {
      // Skip undefined values
      continue;
    }
    normalized[key] = normalizeCacheKeyValue(value);
  }

  return JSON.stringify(
    Object.fromEntries(
      Object.keys(normalized)
        .sort()
        .map(key => [key, normalized[key]])
    )
  );
};
