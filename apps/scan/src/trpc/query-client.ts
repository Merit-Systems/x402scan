import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from '@tanstack/react-query';
import SuperJSON from 'superjson';

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 30 * 1000,
        // Prevent refetching when switching tabs - this prevents issues
        // where pending queries in cache from previous navigations cause
        // infinite refetch loops or unresponsive behavior
        refetchOnWindowFocus: false,
        // Only refetch on mount if data is stale
        refetchOnMount: true,
        // Prevent infinite retries that could cause unresponsive behavior
        retry: 1,
        // Garbage collect unused queries after 5 minutes to prevent memory leaks
        gcTime: 5 * 60 * 1000,
      },
      dehydrate: {
        serializeData: SuperJSON.serialize,
        // Allow dehydrating pending queries for streaming SSR (as of v5.40.0)
        // This enables streaming data to the client as queries resolve.
        // The refetchOnWindowFocus: false above prevents issues when switching tabs
        // where stale pending queries in cache could cause problems.
        shouldDehydrateQuery: query =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending',
      },
      hydrate: {
        deserializeData: SuperJSON.deserialize,
      },
    },
  });
