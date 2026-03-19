'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
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
 * Uses a mutation (POST) to avoid URL length limits with large inputs.
 */
export function useBatchTest(
  effectiveResources: DiscoveredResource[],
  enabled: boolean
): BatchTestResult {
  const [resources, setResources] = useState<TestedResource[]>([]);
  const [failed, setFailed] = useState<FailedResource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [runCount, setRunCount] = useState(0);

  const mutation = api.developer.batchTest.useMutation();
  const mutateAsyncRef = useRef(mutation.mutateAsync);
  mutateAsyncRef.current = mutation.mutateAsync;

  const chunks = useMemo(
    () => chunkArray(effectiveResources, BATCH_SIZE),
    [effectiveResources]
  );

  useEffect(() => {
    if (!enabled || chunks.length === 0) {
      setResources([]);
      setFailed([]);
      return;
    }

    setIsLoading(true);

    void Promise.all(chunks.map(chunk => mutateAsyncRef.current({ resources: chunk })))
      .then(results => {
        const allResources: TestedResource[] = [];
        const allFailed: FailedResource[] = [];
        for (const result of results) {
          allResources.push(...result.resources);
          allFailed.push(...result.failed);
        }
        setResources(allResources);
        setFailed(allFailed);
      })
      .catch(err => {
        const error = err instanceof Error ? err.message : 'Request failed';
        setFailed(chunks.flat().map(r => ({ success: false as const, url: r.url, error })));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [enabled, chunks, runCount]);

  const payToAddresses = useMemo(() => {
    const addresses: string[] = [];
    for (const resource of resources) {
      for (const opt of resource.parsed.paymentOptions ?? []) {
        if ('payTo' in opt && typeof opt.payTo === 'string') {
          addresses.push(opt.payTo);
        }
      }
    }
    return [...new Set(addresses)];
  }, [resources]);

  return {
    isLoading,
    resources,
    failed,
    payToAddresses,
    refetch: () => setRunCount(c => c + 1),
  };
}
