'use client';

import { useState, useEffect, useRef } from 'react';

import { httpLink, loggerLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

import SuperJSON from 'superjson';

import { createQueryClient } from './query-client';
import { env } from '@/env';

import type { AppRouter } from './routers';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';

let clientQueryClientSingleton: QueryClient | undefined = undefined;
const getQueryClient = () => {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return createQueryClient();
  }
  // Browser: use singleton pattern to keep the same query client
  clientQueryClientSingleton ??= createQueryClient();

  return clientQueryClientSingleton;
};

export const api = createTRPCReact<AppRouter>();

/**
 * Recovers orphaned pending queries that were dehydrated during SSR streaming
 * but whose promises never resolved (e.g., due to fast navigation).
 *
 * Orphaned queries are detected by checking for queries that are in "pending"
 * state but have no active fetch (fetchStatus: 'idle'). These queries will
 * hang forever unless we force them to refetch.
 *
 * The recovery works by:
 * 1. Monitoring the query cache for queries in "pending + idle" state
 * 2. After a timeout, resetting the query to trigger a fresh fetch
 * 3. This causes useSuspenseQuery to start a new fetch instead of waiting
 *    on the orphaned Promise
 */
function useHydrationRecovery(queryClient: QueryClient) {
  const pendingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    const ORPHAN_TIMEOUT_MS = 5000; // Time to wait before considering a query orphaned

    const unsubscribe = queryClient.getQueryCache().subscribe(event => {
      if (!event.query) return;

      const queryHash = event.query.queryHash;
      const state = event.query.state;

      // Query is pending but not actively fetching - potential orphan
      if (state.status === 'pending' && state.fetchStatus === 'idle') {
        // Don't set multiple timeouts for the same query
        if (!pendingTimeoutsRef.current.has(queryHash)) {
          const timeoutId = setTimeout(() => {
            // Re-check the query state after timeout
            const currentState = event.query.state;
            if (
              currentState.status === 'pending' &&
              currentState.fetchStatus === 'idle'
            ) {
              console.warn(
                `[Hydration Recovery] Query "${queryHash.slice(0, 80)}..." orphaned, starting fetch`
              );
              // Start an actual fetch for this query. This will resolve the
              // Promise that useSuspenseQuery is waiting on, allowing the
              // component to resume rendering.
              void event.query.fetch();
            }
            pendingTimeoutsRef.current.delete(queryHash);
          }, ORPHAN_TIMEOUT_MS);

          pendingTimeoutsRef.current.set(queryHash, timeoutId);
        }
      } else {
        // Query is no longer in orphan-candidate state, clear any pending timeout
        const existingTimeout = pendingTimeoutsRef.current.get(queryHash);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
          pendingTimeoutsRef.current.delete(queryHash);
        }
      }
    });

    return () => {
      unsubscribe();
      // Clean up all pending timeouts
      pendingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      // eslint-disable-next-line react-hooks/exhaustive-deps
      pendingTimeoutsRef.current.clear();
    };
  }, [queryClient]);
}

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  // Recover from orphaned pending queries after hydration
  useHydrationRecovery(queryClient);

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({
          enabled: op =>
            env.NEXT_PUBLIC_NODE_ENV === 'development' ||
            (op.direction === 'down' && op.result instanceof Error),
        }),
        httpLink({
          transformer: SuperJSON,
          url: getBaseUrl() + '/api/trpc',
          headers: () => {
            const headers = new Headers();
            headers.set('x-trpc-source', 'nextjs-react');
            return headers;
          },
        }),
      ],
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {props.children}
      </api.Provider>
    </QueryClientProvider>
  );
}

function getBaseUrl() {
  if (typeof window !== 'undefined') return window.location.origin;
  return env.NEXT_PUBLIC_APP_URL;
}

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
