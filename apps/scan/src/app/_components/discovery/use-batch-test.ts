'use client';

import { useMemo } from 'react';
import { api } from '@/trpc/client';
import type { TestedResource, FailedResource } from '@/types/batch-test';
import type { DiscoveredResource } from '@/types/discovery';

interface BatchTestResult {
  isLoading: boolean;
  resources: TestedResource[];
  failed: FailedResource[];
  payToAddresses: string[];
  refetch: () => void;
}

/**
 * Wrapper hook for api.developer.batchTest that provides explicit typing.
 */
export function useBatchTest(
  effectiveResources: DiscoveredResource[],
  enabled: boolean
): BatchTestResult {
  const query = api.developer.batchTest.useQuery(
    { resources: effectiveResources },
    {
      enabled,
      staleTime: 60000,
    }
  );

  const payToAddresses = useMemo(() => {
    if (!query.data) return [];
    const addresses: string[] = [];
    for (const resource of query.data.resources) {
      for (const accept of resource.parsed.accepts ?? []) {
        if ('payTo' in accept && typeof accept.payTo === 'string') {
          addresses.push(accept.payTo);
        }
      }
    }
    return [...new Set(addresses)];
  }, [query.data]);

  return {
    isLoading: query.isLoading,
    resources: query.data?.resources ?? [],
    failed: query.data?.failed ?? [],
    payToAddresses,
    refetch: () => {
      void query.refetch();
    },
  };
}
