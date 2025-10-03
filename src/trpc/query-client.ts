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
        retry: 2,
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        // Critical: Set a network timeout to prevent infinite hangs
        networkMode: 'offlineFirst',
        gcTime: 5 * 60 * 1000, // 5 minutes
      },
      dehydrate: {
        serializeData: SuperJSON.serialize,
        shouldDehydrateQuery: query =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending',
      },
      hydrate: {
        deserializeData: SuperJSON.deserialize,
      },
      mutations: {
        networkMode: 'offlineFirst',
      },
    },
  });
