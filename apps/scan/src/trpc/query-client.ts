import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from '@tanstack/react-query';
import SuperJSON from 'superjson';

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // DEBUGGING: Disable all React Query caching
        staleTime: 0, // Data is immediately stale
        gcTime: 0, // Don't cache at all
        refetchOnWindowFocus: false,
        refetchOnMount: 'always', // Always refetch
        retry: 1,
      },
      dehydrate: {
        serializeData: SuperJSON.serialize,
        // Include pending queries in dehydration so that Suspense boundaries
        // can properly resume on the client during navigation
        // @see https://trpc.io/docs/client/tanstack-react-query/server-components
        shouldDehydrateQuery: query => {
          const shouldDehydrate =
            defaultShouldDehydrateQuery(query) ||
            query.state.status === 'pending';

          // Debug logging - remove in production
          if (
            shouldDehydrate &&
            process.env.NODE_ENV === 'development' &&
            typeof window === 'undefined'
          ) {
            try {
              // Use SuperJSON to handle BigInt and other special types
              const serialized = SuperJSON.stringify(query.state.data ?? {});
              const dataSize = serialized.length;
              const queryKey = SuperJSON.stringify(query.queryKey);
              if (dataSize > 10000) {
                // Log queries with data > 10KB
                console.warn(
                  `[Dehydration] Large query (${(dataSize / 1024).toFixed(1)}KB):`,
                  queryKey.slice(0, 100)
                );
              }
            } catch (error) {
              // Ignore serialization errors in debug logging
              console.error(
                'Error serializing query data:',
                error instanceof Error ? error.message : String(error)
              );
            }
          }

          return shouldDehydrate;
        },
      },
      hydrate: {
        deserializeData: SuperJSON.deserialize,
      },
    },
  });
