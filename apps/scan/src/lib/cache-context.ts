import { AsyncLocalStorage } from 'async_hooks';

/**
 * Cache context that can be set per-request to control cache behavior
 */
export interface CacheContext {
  forceRefresh?: boolean;
}

/**
 * AsyncLocalStorage for cache context
 * This allows us to set cache behavior per-request without passing it through every function
 */
const cacheContextStorage = new AsyncLocalStorage<CacheContext>();

/**
 * Get the current cache context
 */
export function getCacheContext(): CacheContext {
  return cacheContextStorage.getStore() ?? {};
}

/**
 * Run a function with a specific cache context
 */
export function withCacheContext<T>(
  context: CacheContext,
  fn: () => T
): T {
  return cacheContextStorage.run(context, fn);
}
