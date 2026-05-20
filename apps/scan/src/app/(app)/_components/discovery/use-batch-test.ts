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
  retryOne: (
    url: string,
    options?: { sampleBody?: string; testUrl?: string }
  ) => Promise<void>;
}

const BATCH_SIZE = 5;

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
 * Splits resources into small chunks and streams results progressively —
 * each chunk updates the UI as soon as it resolves.
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
  useEffect(() => {
    mutateAsyncRef.current = mutation.mutateAsync;
  });

  const chunks = useMemo(
    () => chunkArray(effectiveResources, BATCH_SIZE),
    [effectiveResources]
  );

  useEffect(() => {
    if (!enabled || chunks.length === 0) return;

    // Clear previous results and start loading
    void Promise.resolve()
      .then(() => {
        setIsLoading(true);
        setResources([]);
        setFailed([]);
      })
      .then(() =>
        // Fire all chunks in parallel; update state as each resolves so the
        // merchant sees results stream in progressively.
        Promise.all(
          chunks.map(chunk =>
            mutateAsyncRef.current({ resources: chunk }).then(
              result => {
                setResources(prev => [...prev, ...result.resources]);
                setFailed(prev => [...prev, ...result.failed]);
              },
              err => {
                const error =
                  err instanceof Error ? err.message : 'Request failed';
                setFailed(prev => [
                  ...prev,
                  ...chunk.map(r => ({
                    success: false as const,
                    url: r.url,
                    error,
                  })),
                ]);
              }
            )
          )
        )
      )
      .finally(() => {
        setIsLoading(false);
      });
  }, [enabled, chunks, runCount]);

  const active = enabled && chunks.length > 0;

  const payToAddresses = useMemo(() => {
    if (!active) return [];
    const addresses: string[] = [];
    for (const resource of resources) {
      for (const opt of resource.parsed.paymentOptions ?? []) {
        if ('payTo' in opt && typeof opt.payTo === 'string') {
          addresses.push(opt.payTo);
        }
      }
    }
    return [...new Set(addresses)];
  }, [active, resources]);

  const retryOne = async (
    url: string,
    options?: { sampleBody?: string; testUrl?: string }
  ) => {
    const probeUrl = options?.testUrl ?? url;
    const resource = effectiveResources.find(r => r.url === url);
    try {
      const result = await mutateAsyncRef.current({
        resources: [
          {
            url: probeUrl,
            method: resource?.method,
            authMode: resource?.authMode,
            invalid: resource?.invalid,
            invalidReason: resource?.invalidReason,
            sampleBody: options?.sampleBody,
          },
        ],
      });

      // Merge result: replace existing entry for the original URL
      setResources(prev => {
        const without = prev.filter(r => r.url !== url);
        return [...without, ...result.resources];
      });
      setFailed(prev => {
        const without = prev.filter(r => r.url !== url);
        return [...without, ...result.failed];
      });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Request failed';
      setFailed(prev => {
        const without = prev.filter(r => r.url !== url);
        return [...without, { success: false as const, url, error }];
      });
    }
  };

  return {
    isLoading: isLoading && active,
    resources: active ? resources : [],
    failed: active ? failed : [],
    payToAddresses,
    refetch: () => setRunCount(c => c + 1),
    retryOne,
  };
}
