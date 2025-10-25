import { unstable_cache } from 'next/cache';
import type { PaginatedQueryParams, PaginatedResponse } from './pagination';

/**
 * Global cache duration in minutes
 * This should match the interval used for date rounding to prevent cache fragmentation
 */
const CACHE_DURATION_MINUTES = 5;
const CACHE_DURATION_SECONDS = CACHE_DURATION_MINUTES * 60;

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
  return async (...args: TInput): Promise<TOutput> => {
    const cacheKey = config.createCacheKey(...args);

    const result = await unstable_cache(
      async () => {
        const data = await config.queryFn(...args);
        return config.serialize(data);
      },
      [config.cacheKeyPrefix, cacheKey],
      {
        revalidate: config.revalidate ?? CACHE_DURATION_SECONDS,
        tags: config.tags,
      }
    )();

    return config.deserialize(result);
  };
};

/**
 * Generic cached query wrapper for single items with dates
 */
export const createCachedQuery = <TInput extends unknown[], TOutput>(config: {
  queryFn: (...args: TInput) => Promise<TOutput>;
  cacheKeyPrefix: string;
  createCacheKey: (...args: TInput) => string;
  dateFields: (keyof TOutput)[];
  revalidate?: number;
  tags?: string[];
}) => {
  return createCachedQueryBase({
    ...config,
    serialize: data => serializeDates(data, config.dateFields),
    deserialize: data => deserializeDates(data, config.dateFields),
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
