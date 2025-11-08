import 'server-only';

import { createHydrationHelpers } from '@trpc/react-query/rsc';
import { cache } from 'react';

import { createCaller, type AppRouter } from './routers';
import { createTRPCContext } from './trpc';
import { createQueryClient } from './query-client';
import { headers } from 'next/headers';
import { withCacheContext } from '@/lib/cache-context';

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(async () => {
  const heads = new Headers(await headers());
  heads.set('x-trpc-source', 'rsc');

  return createTRPCContext(heads);
});

const getQueryClient = cache(createQueryClient);
const caller = createCaller(createContext);

export const { trpc: api, HydrateClient } = createHydrationHelpers<AppRouter>(
  caller,
  getQueryClient
);

/**
 * Create a special API instance with custom headers for cache warming
 */
export function createCacheWarmingApi(cronSecret: string) {
  const warmingHeaders = new Headers();
  warmingHeaders.set('x-trpc-source', 'cache-warming');
  warmingHeaders.set('x-cache-refresh', 'true');
  warmingHeaders.set('authorization', `Bearer ${cronSecret}`);

  const warmingContext = cache(async () => createTRPCContext(warmingHeaders));
  const warmingCaller = createCaller(warmingContext);

  // Create a proxy that wraps all method calls with cache context
  return new Proxy(warmingCaller, {
    get(target, prop) {
      const value = target[prop as keyof typeof target];
      if (typeof value === 'object' && value !== null) {
        // Recursively proxy nested objects
        return new Proxy(value, {
          get(nestedTarget, nestedProp) {
            const nestedValue =
              nestedTarget[nestedProp as keyof typeof nestedTarget];
            if (typeof nestedValue === 'function') {
              // Wrap function calls with cache context
              return (...args: unknown[]) =>
                withCacheContext({ forceRefresh: true }, () =>
                  (nestedValue as (...args: unknown[]) => unknown).apply(
                    nestedTarget,
                    args
                  )
                );
            }
            // If it's another nested object, proxy it too
            if (typeof nestedValue === 'object' && nestedValue !== null) {
              return new Proxy(nestedValue, this);
            }
            return nestedValue;
          },
        });
      }
      return value;
    },
  }) as typeof warmingCaller;
}
