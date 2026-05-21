'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { api } from '@/trpc/client';
import type { TestedResource, FailedResource } from '@/types/batch-test';
import type { DiscoveredResource } from '@/types/discovery';

export interface BatchTestProgress {
  checked: number;
  total: number;
}

interface BatchTestResult {
  isLoading: boolean;
  progress: BatchTestProgress | null;
  resources: TestedResource[];
  failed: FailedResource[];
  payToAddresses: string[];
  refetch: () => void;
  retryOne: (
    url: string,
    options?: { sampleBody?: string; testUrl?: string }
  ) => Promise<void>;
}

// One endpoint per request for per-endpoint progress updates.
// The server probes sequentially anyway, so N requests of 1 endpoint
// has the same total probe time as 1 request of N endpoints.
const BATCH_SIZE = 1;

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
 * Processes chunks sequentially so results stream into the UI progressively
 * without overwhelming the server with concurrent requests.
 * Uses a mutation (POST) to avoid URL length limits with large inputs.
 */
export function useBatchTest(
  effectiveResources: DiscoveredResource[],
  enabled: boolean
): BatchTestResult {
  const [resources, setResources] = useState<TestedResource[]>([]);
  const [failed, setFailed] = useState<FailedResource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<BatchTestProgress | null>(null);
  const [runCount, setRunCount] = useState(0);

  const mutation = api.developer.batchTest.useMutation();
  const mutateAsyncRef = useRef(mutation.mutateAsync);
  useEffect(() => {
    mutateAsyncRef.current = mutation.mutateAsync;
  });

  // Sort paid endpoints first so they're probed before unclassified ones.
  // This prevents rate limiting from burning through all probes on non-paid
  // endpoints before reaching the ones that actually matter.
  const sortedResources = useMemo(() => {
    const paidModes = new Set(['paid', 'apiKey+paid']);
    return [...effectiveResources].sort((a, b) => {
      const aPaid = a.authMode != null && paidModes.has(a.authMode) ? 0 : 1;
      const bPaid = b.authMode != null && paidModes.has(b.authMode) ? 0 : 1;
      return aPaid - bPaid;
    });
  }, [effectiveResources]);

  const chunks = useMemo(
    () => chunkArray(sortedResources, BATCH_SIZE),
    [sortedResources]
  );

  useEffect(() => {
    if (!enabled || chunks.length === 0) return;

    let cancelled = false;

    const run = async () => {
      if (!cancelled) {
        setIsLoading(true);
        setProgress({ checked: 0, total: effectiveResources.length });
      }

      const allResources: TestedResource[] = [];
      const allFailed: FailedResource[] = [];

      try {
        for (const chunk of chunks) {
          if (cancelled) return;
          const result = await mutateAsyncRef.current({ resources: chunk });
          allResources.push(...result.resources);
          allFailed.push(...result.failed);
          if (!cancelled) {
            setResources([...allResources]);
            setFailed([...allFailed]);
            setProgress({
              checked: allResources.length + allFailed.length,
              total: effectiveResources.length,
            });
          }
        }
      } catch (err) {
        if (cancelled) return;
        const error = err instanceof Error ? err.message : 'Request failed';
        setFailed(
          chunks
            .flat()
            .map(r => ({ success: false as const, url: r.url, error }))
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setProgress(null);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [enabled, chunks, runCount, effectiveResources.length]);

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
    progress: active ? progress : null,
    resources: active ? resources : [],
    failed: active ? failed : [],
    payToAddresses,
    refetch: () => setRunCount(c => c + 1),
    retryOne,
  };
}
