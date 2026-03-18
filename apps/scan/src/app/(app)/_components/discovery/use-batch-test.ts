'use client';

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
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

const BATCH_SIZE = 20;

/**
 * Split array into chunks of specified size
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Wrapper hook for api.developer.batchTest that handles pagination.
 * Automatically splits resources into chunks of 20 and makes parallel requests.
 */
export function useBatchTest(
  effectiveResources: DiscoveredResource[],
  enabled: boolean
): BatchTestResult {
  const chunks = useMemo(
    () => chunkArray(effectiveResources, BATCH_SIZE),
    [effectiveResources]
  );

  // Get tRPC context for making queries
  const utils = api.useUtils();

  // Use useQueries to fetch all chunks in parallel
  const queries = useQueries({
    queries: chunks.map(chunk => ({
      queryKey: ['developer.batchTest', { resources: chunk }],
      queryFn: () => utils.developer.batchTest.fetch({ resources: chunk }),
      enabled: enabled && chunks.length > 0,
      staleTime: 60000,
    })),
  });

  // Combine results from all queries
  const combinedData = useMemo(() => {
    const allResources: TestedResource[] = [];
    const allFailed: FailedResource[] = [];

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      const chunk = chunks[i] ?? [];

      if (query.data) {
        allResources.push(...query.data.resources);
        allFailed.push(...query.data.failed);
      } else if (query.isError) {
        const error =
          query.error instanceof Error ? query.error.message : 'Request failed';
        for (const resource of chunk) {
          allFailed.push({ success: false, url: resource.url, error });
        }
      }
    }

    return {
      resources: allResources,
      failed: allFailed,
    };
  }, [queries, chunks]);

  const isLoading = queries.some(q => q.isLoading);

  const payToAddresses = useMemo(() => {
    const addresses: string[] = [];
    for (const resource of combinedData.resources) {
      for (const opt of resource.parsed.paymentOptions ?? []) {
        if ('payTo' in opt && typeof opt.payTo === 'string') {
          addresses.push(opt.payTo);
        }
      }
    }
    return [...new Set(addresses)];
  }, [combinedData.resources]);

  return {
    isLoading,
    resources: combinedData.resources,
    failed: combinedData.failed,
    payToAddresses,
    refetch: () => {
      queries.forEach(q => void q.refetch());
    },
  };
}
