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
        // Prevent refetching when switching browser tabs - this prevents issues
        // where queries refetch on focus causing unexpected behavior
        refetchOnWindowFocus: false,
        // Only refetch on mount if data is stale
        refetchOnMount: true,
        // Limit retries to prevent infinite retry loops
        retry: 1,
        // Garbage collect unused queries after 5 minutes to prevent memory leaks
        gcTime: 5 * 60 * 1000,
      },
      dehydrate: {
        serializeData: SuperJSON.serialize,
        // Include pending queries in dehydration so that Suspense boundaries
        // can properly resume on the client during navigation
        // @see https://trpc.io/docs/client/tanstack-react-query/server-components
        shouldDehydrateQuery: query =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending',
      },
      hydrate: {
        deserializeData: SuperJSON.deserialize,
      },
    },
  });
