'use client';

import { useMemo } from 'react';
import z from 'zod';

import { api } from '@/trpc/client';

import type { DiscoveredResource } from '@/types/discovery';

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
  }) => void;
  /** Called when bulk registration fails */
  onRegisterAllError?: () => void;
}

export function useDiscovery({
  url,
  onRegisterAllSuccess,
  onRegisterAllError,
}: UseDiscoveryOptions) {
  const utils = api.useUtils();

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
  const discoveryQuery = api.public.resources.checkDiscovery.useQuery(
    { origin: urlOrigin! },
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

  // Batch test query - runs when we have resources to test
  const batchTestQuery = api.developer.batchTest.useQuery(
    { resources: effectiveResources },
    {
      enabled: discoveryCheckComplete && effectiveResources.length > 0,
      staleTime: 60000, // Cache for 1 min
    }
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
    onSuccess: data => {
      if (!data.success) {
        onRegisterAllError?.();
        return;
      }
      void utils.public.resources.list.invalidate();
      void utils.public.origins.list.withResources.invalidate();
      void utils.public.sellers.bazaar.list.invalidate();
      onRegisterAllSuccess?.({
        registered: data.registered,
        total: data.total,
        failed: data.failed,
      });
    },
    onError: () => {
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
    isDiscoveryLoading: discoveryQuery.isLoading,
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

    // Origin preview
    isPreviewLoading: previewQuery.isLoading,
    preview: previewQuery.data?.preview ?? null,

    // Test results (x402 responses for resources)
    isBatchTestLoading: batchTestQuery.isLoading,
    testedResources: batchTestQuery.data?.resources ?? [],
    failedResources: batchTestQuery.data?.failed ?? [],

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
        }
      : null,
    handleRegisterAll,
    resetBulk,

    // Refresh discovery data
    refreshDiscovery: () => {
      void discoveryQuery.refetch();
      void previewQuery.refetch();
      void batchTestQuery.refetch();
    },
  };
}
