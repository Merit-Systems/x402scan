'use client';

import { useMemo, useState } from 'react';
import z from 'zod';

import { api } from '@/trpc/client';

import type { FailedResource, TestedResource } from '@/types/batch-test';
import type { DiscoveredResource, DiscoverySource } from '@/types/discovery';
import type { OriginPreview } from './discovery-panel';
import { useBatchTest } from './use-batch-test';
import { useOwnership } from './use-ownership';

/**
 * Get the origin from a URL
 */
function getOrigin(urlString: string): string {
  try {
    return new URL(urlString).origin;
  } catch {
    return urlString;
  }
}

/**
 * Check if a URL is an origin-only URL (no path beyond /)
 */
function isOriginUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    return parsed.pathname === '/' || parsed.pathname === '';
  } catch {
    return false;
  }
}

export interface UseDiscoveryOptions {
  /** The URL to check discovery for */
  url: string;
  /** Called when bulk registration succeeds */
  onRegisterAllSuccess?: (data: {
    registered: number;
    total: number;
    failed: number;
    deprecated?: number;
  }) => void;
  /** Called when bulk registration fails */
  onRegisterAllError?: () => void;
}

export interface UseDiscoveryReturn {
  // URL info
  isValidUrl: boolean;
  urlOrigin: string | null;
  isOriginOnly: boolean;
  enteredUrlInDiscovery: boolean;

  // Discovery state
  discoveryQuery: unknown;
  isDiscoveryLoading: boolean;
  discoveryFound: boolean;
  discoverySource?: DiscoverySource;
  discoveryResources: string[];
  actualDiscoveredResources: string[];
  discoveryResourceCount: number;
  discoveryError?: string;
  invalidResourcesMap: Record<string, { invalid: boolean; reason?: string }>;

  // Origin preview
  isPreviewLoading: boolean;
  preview: OriginPreview | null;

  // Test results
  isBatchTestLoading: boolean;
  testedResources: TestedResource[];
  failedResources: FailedResource[];

  // Ownership verification
  hasOwnershipProofs: boolean;
  ownershipProofs: string[];
  payToAddresses: string[];
  ownershipVerified: boolean;
  recoveredAddresses: string[];
  verifiedAddresses: Record<string, boolean>;
  isVerifyingOwnership: boolean;

  // Registration status
  isCheckingRegistered: boolean;
  registeredUrls: string[];

  // Bulk registration
  isRegisteringAll: boolean;
  bulkData: {
    success: true;
    registered: number;
    total: number;
    failed: number;
    skipped?: number;
    deprecated?: number;
    failedDetails?: { url: string; error: string; status?: number }[];
    skippedDetails?: { url: string; error: string; status?: number }[];
    originId?: string;
  } | null;
  bulkError: string | null;
  handleRegisterAll: () => void;
  resetBulk: () => void;

  // Refresh
  refreshDiscovery: () => void;

  // Retry single resource
  retryResource: (url: string) => Promise<void>;
}

export function useDiscovery({
  url,
  onRegisterAllSuccess,
  onRegisterAllError,
}: UseDiscoveryOptions): UseDiscoveryReturn {
  const utils = api.useUtils();
  const [bulkError, setBulkError] = useState<string | null>(null);

  // Check if URL is valid and extract origin
  const isValidUrl = useMemo(() => z.url().safeParse(url).success, [url]);
  const urlOrigin = useMemo(
    () => (isValidUrl ? getOrigin(url) : null),
    [url, isValidUrl]
  );
  const isOriginOnly = useMemo(
    () => isValidUrl && isOriginUrl(url),
    [url, isValidUrl]
  );

  // Discovery query - runs automatically when we have a valid URL
  // Note: bustCache is not used in initial query, only on manual refresh
  const discoveryQuery = api.public.resources.checkDiscovery.useQuery(
    { origin: urlOrigin!, bustCache: false },
    {
      enabled: !!urlOrigin,
      retry: false,
      staleTime: 30000, // Cache for 30s to avoid re-fetching on every keystroke
    }
  );

  const discoveryFound = discoveryQuery.data?.found ?? false;
  const discoveryResources: DiscoveredResource[] = useMemo(
    () => (discoveryQuery.data?.found ? discoveryQuery.data.resources : []),
    [discoveryQuery.data]
  );
  const discoveryCheckComplete =
    !discoveryQuery.isLoading && discoveryQuery.isFetched;

  // Check if the entered URL is in the discovered resources
  const enteredUrlInDiscovery = useMemo(() => {
    if (!isValidUrl || isOriginOnly) return true; // Origin-only URLs don't need to be in discovery
    return discoveryResources.some(r => r.url === url);
  }, [url, isValidUrl, isOriginOnly, discoveryResources]);

  // Compute effective resources: entered URL at top if not in discovery, then discovered
  const effectiveResources: DiscoveredResource[] = useMemo(() => {
    if (!isValidUrl) return [];

    // If discovery found resources
    if (discoveryFound && discoveryResources.length > 0) {
      // If entered URL is specific (not origin) and not in discovered list, prepend it
      if (!isOriginOnly && !enteredUrlInDiscovery) {
        return [{ url }, ...discoveryResources];
      }
      return discoveryResources;
    }

    // No discovery - just test the entered URL if it's specific
    if (!isOriginOnly) {
      return [{ url }];
    }

    return [];
  }, [
    isValidUrl,
    isOriginOnly,
    discoveryFound,
    discoveryResources,
    enteredUrlInDiscovery,
    url,
  ]);

  // Origin preview query - runs when we have a valid URL (always, for favicon/OG)
  const previewQuery = api.developer.preview.useQuery(
    { url: urlOrigin! },
    {
      enabled: !!urlOrigin,
      staleTime: 60000, // Cache for 1 min
    }
  );

  // Extract URLs for display (string[])
  const resourceUrls = useMemo(
    () => effectiveResources.map(r => r.url),
    [effectiveResources]
  );
  // Only the actually discovered resources (not the prepended user-entered URL)
  const actualDiscoveredUrls = useMemo(
    () => discoveryResources.map(r => r.url),
    [discoveryResources]
  );
  // Create map of URL -> invalid status for displaying badges
  const invalidResourcesMap: Record<
    string,
    { invalid: boolean; reason?: string }
  > = useMemo(() => {
    const map: Record<string, { invalid: boolean; reason?: string }> = {};
    for (const resource of effectiveResources) {
      if (resource.invalid) {
        const entry: { invalid: boolean; reason?: string } = {
          invalid: true,
        };
        if (resource.invalidReason) {
          entry.reason = resource.invalidReason;
        }
        map[resource.url] = entry;
      }
    }
    return map;
  }, [effectiveResources]);

  // Batch test query - uses wrapper hook for proper typing
  const batchTest = useBatchTest(
    effectiveResources,
    discoveryCheckComplete && effectiveResources.length > 0
  );

  // Ownership verification - uses wrapper hook to isolate tRPC type issues
  const ownership = useOwnership(
    discoveryQuery.data,
    urlOrigin,
    batchTest.payToAddresses
  );

  // Check which resources are already registered
  const registeredCheckQuery = api.public.resources.checkRegistered.useQuery(
    { urls: resourceUrls },
    {
      enabled: discoveryCheckComplete && resourceUrls.length > 0,
      staleTime: 60000, // Cache for 1 min
    }
  );

  // Bulk registration mutation
  const {
    mutate: registerFromOrigin,
    isPending: isRegisteringAll,
    data: bulkData,
    reset: resetBulk,
  } = api.public.resources.registerFromOrigin.useMutation({
    onMutate: () => {
      setBulkError(null);
    },
    onSuccess: data => {
      if (!data.success) {
        setBulkError(data.error.message);
        onRegisterAllError?.();
        return;
      }
      setBulkError(null);
      void utils.public.resources.list.invalidate();
      void utils.public.origins.list.withResources.invalidate();
      void utils.public.sellers.bazaar.list.invalidate();
      onRegisterAllSuccess?.({
        registered: data.registered,
        total: data.total,
        failed: data.failed,
        deprecated: data.deprecated,
      });
    },
    onError: () => {
      setBulkError('Failed to register resources');
      onRegisterAllError?.();
    },
  });

  // Handle registering all discovered resources
  const handleRegisterAll = () => {
    if (!urlOrigin) return;
    registerFromOrigin({ origin: urlOrigin });
  };

  return {
    // URL info
    isValidUrl,
    urlOrigin,
    isOriginOnly,
    enteredUrlInDiscovery,

    // Discovery state
    discoveryQuery,
    isDiscoveryLoading: discoveryQuery.isLoading || discoveryQuery.isFetching,
    discoveryFound,
    discoverySource: discoveryQuery.data?.found
      ? discoveryQuery.data.source
      : undefined,
    discoveryResources: resourceUrls,
    actualDiscoveredResources: actualDiscoveredUrls,
    discoveryResourceCount: effectiveResources.length,
    discoveryError:
      discoveryQuery.data?.found === false
        ? discoveryQuery.data.error
        : undefined,
    invalidResourcesMap,

    // Origin preview
    isPreviewLoading: previewQuery.isLoading,
    preview: (previewQuery.data?.preview ?? null) as OriginPreview | null,

    // Test results
    isBatchTestLoading: batchTest.isLoading,
    testedResources: batchTest.resources,
    failedResources: batchTest.failed,

    // Ownership verification
    hasOwnershipProofs: ownership.ownershipProofs.length > 0,
    ownershipProofs: ownership.ownershipProofs,
    payToAddresses: batchTest.payToAddresses,
    ownershipVerified: ownership.ownershipVerified,
    recoveredAddresses: ownership.recoveredAddresses,
    verifiedAddresses: ownership.verifiedAddresses,
    isVerifyingOwnership: ownership.isVerifyingOwnership,

    // Registration status
    isCheckingRegistered: registeredCheckQuery.isLoading,
    registeredUrls: registeredCheckQuery.data?.registered ?? [],

    // Bulk registration
    isRegisteringAll,
    bulkData: bulkData?.success
      ? {
          success: true as const,
          registered: bulkData.registered,
          total: bulkData.total,
          failed: bulkData.failed,
          skipped: bulkData.skipped,
          deprecated: bulkData.deprecated,
          failedDetails: bulkData.failedDetails,
          skippedDetails: bulkData.skippedDetails,
          originId: bulkData.originId,
        }
      : null,
    bulkError,
    handleRegisterAll,
    resetBulk: () => {
      setBulkError(null);
      resetBulk();
    },

    // Refresh discovery data with cache busting
    refreshDiscovery: () => {
      if (!urlOrigin) return;

      // Fetch fresh data with cache busting
      // The isFetching state will show loading indicator
      void utils.public.resources.checkDiscovery
        .fetch({
          origin: urlOrigin,
          bustCache: true,
        })
        .then(() => {
          // Invalidate to ensure the query picks up the new data
          void utils.public.resources.checkDiscovery.invalidate({
            origin: urlOrigin,
          });
          // Refresh other queries after discovery is fetched
          void previewQuery.refetch();
          batchTest.refetch();
        });
    },

    // Retry a single resource with cache busting
    retryResource: async (resourceUrl: string) => {
      // Invalidate ALL batch test query caches to force fresh fetch
      // This ensures React Query doesn't return cached results
      await utils.developer.batchTest.invalidate();

      // Fetch fresh data for this resource
      // The testSingleResource function already uses cache: 'no-store' and Cache-Control: 'no-cache'
      await utils.developer.batchTest.fetch({
        resources: [{ url: resourceUrl }],
      });

      // Refetch all batch tests to update the UI with fresh data
      batchTest.refetch();
    },
  };
}
