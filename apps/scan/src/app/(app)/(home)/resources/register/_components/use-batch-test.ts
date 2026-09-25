"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api, type RouterInputs } from "@/trpc/client";
import type { TestedResource, FailedResource } from "@/types/batch-test";
import type { DiscoveredResource } from "@/types/discovery";

export interface BatchTestProgress {
  checked: number;
  total: number;
}

interface BatchTestResult {
  isLoading: boolean;
  progress: BatchTestProgress | null;
  resources: TestedResource[];
  failed: FailedResource[];
  /** Server-side probe session ID. Pass to registerFromOrigin so the server
   *  reuses cached probe results instead of re-probing. */
  probeSessionId: string | null;
}

// One endpoint per request for per-endpoint progress updates.
// The server probes sequentially anyway, so N requests of 1 endpoint
// has the same total probe time as 1 request of N endpoints.
const BATCH_SIZE = 1;

function isAborted(signal: AbortSignal) {
  return signal.aborted;
}

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
  const [probeSessionId, setProbeSessionId] = useState<string | null>(null);

  const mutation = api.developer.batchTest.useMutation();
  const mutateAsyncRef = useRef(mutation.mutateAsync);
  useEffect(() => {
    mutateAsyncRef.current = mutation.mutateAsync;
  });

  // Sort paid endpoints first so they're probed before unclassified ones.
  // This prevents rate limiting from burning through all probes on non-paid
  // endpoints before reaching the ones that actually matter.
  const sortedResources = useMemo(() => {
    const paidModes = new Set(["paid", "apiKey+paid"]);
    return effectiveResources.toSorted((a, b) => {
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
    if (!enabled || chunks.length === 0) return undefined;

    const controller = new AbortController();

    const run = async () => {
      if (!isAborted(controller.signal)) {
        setIsLoading(true);
        setProbeSessionId(null);
        setProgress({ checked: 0, total: effectiveResources.length });
      }

      const allResources: TestedResource[] = [];
      const allFailed: FailedResource[] = [];
      let sessionId: string | undefined;

      try {
        const runChunk = async (index: number): Promise<void> => {
          const chunk = chunks[index];
          if (!chunk) return;
          if (isAborted(controller.signal)) return;
          const input: RouterInputs["developer"]["batchTest"] = {
            resources: chunk,
          };
          // Pass sessionId from first chunk so all results share one cache
          if (sessionId) {
            input.probeSessionId = sessionId;
          }
          const result = await mutateAsyncRef.current(input);
          if (isAborted(controller.signal)) return;
          sessionId ??= result.probeSessionId;
          setProbeSessionId(sessionId);
          allResources.push(...result.resources);
          allFailed.push(...result.failed);
          setResources([...allResources]);
          setFailed([...allFailed]);
          setProgress({
            checked: allResources.length + allFailed.length,
            total: effectiveResources.length,
          });
          await runChunk(index + 1);
        };

        await runChunk(0);
      } catch (err) {
        if (isAborted(controller.signal)) return;
        const error = err instanceof Error ? err.message : "Request failed";
        setFailed(
          chunks
            .flat()
            .map((r) => ({ success: false as const, url: r.url, error }))
        );
      } finally {
        if (!isAborted(controller.signal)) {
          setIsLoading(false);
          setProgress(null);
        }
      }
    };

    void run();

    return () => {
      controller.abort();
    };
  }, [enabled, chunks, effectiveResources.length]);

  const active = enabled && chunks.length > 0;

  return {
    isLoading: isLoading && active,
    progress: active ? progress : null,
    resources: active ? resources : [],
    failed: active ? failed : [],
    probeSessionId: active ? probeSessionId : null,
  };
}
