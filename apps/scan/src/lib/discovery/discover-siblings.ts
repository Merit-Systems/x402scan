import { getOriginFromUrl, normalizeUrl } from '@/lib/url';
import { fetchDiscoveryDocument } from '@/services/discovery';
import type { DiscoveryInfo } from '@/types/discovery';

/**
 * After registering a single resource, check the origin for a discovery
 * document and return info about sibling resources. Non-blocking — swallows
 * errors so callers never fail because of a missing discovery doc.
 */
export async function discoverSiblingResources(
  registeredUrl: string
): Promise<DiscoveryInfo> {
  const origin = getOriginFromUrl(registeredUrl);

  try {
    const discoveryResult = await fetchDiscoveryDocument(origin);
    if (discoveryResult.success && Array.isArray(discoveryResult.resources)) {
      const normalizedInputUrl = normalizeUrl(String(registeredUrl));
      const otherResources = discoveryResult.resources.filter(r => {
        if (
          !r ||
          typeof r !== 'object' ||
          !('url' in r) ||
          typeof r.url !== 'string'
        ) {
          return false;
        }
        return normalizeUrl(String(r.url)) !== normalizedInputUrl;
      });
      return {
        found: true,
        source: discoveryResult.source,
        otherResourceCount: otherResources.length,
        origin,
        resources: otherResources.map(r => r.url),
      };
    }
  } catch {
    // Discovery check failed, continue without discovery info
  }

  return { found: false, otherResourceCount: 0, origin };
}
