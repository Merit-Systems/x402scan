import { discoverOriginSchema } from '@agentcash/discovery';

import { getOriginFromUrl } from '@/lib/url';
import { isLocalUrl } from '@/lib/url-helpers';

import type {
  DiscoveredResource,
  DiscoverySource,
  X402DiscoveryResult,
} from '@/types/discovery';

const FETCH_TIMEOUT_MS = 10000;

function mapSourceToDiscoverySource(
  source: string | undefined
): DiscoverySource | undefined {
  if (source === 'openapi') return 'openapi';
  if (source === 'well-known/x402') return 'well-known';
  return undefined;
}

/**
 * Fetch discovery data for an origin using @agentcash/discovery.
 *
 * This attempts discovery via multiple methods:
 * openapi.json, /.well-known/x402, and probe-based discovery.
 */
export async function fetchDiscoveryDocument(
  originOrUrl: string,
  bustCache = false
): Promise<X402DiscoveryResult> {
  const origin = originOrUrl.includes('://')
    ? getOriginFromUrl(originOrUrl)
    : `https://${originOrUrl}`;

  if (isLocalUrl(origin)) {
    return {
      success: false,
      resources: [],

      error: 'Local URLs are not supported',
    };
  }

  const signal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
  const headers: Record<string, string> = bustCache
    ? { 'Cache-Control': 'no-cache, no-store' }
    : {};

  const discovered = await discoverOriginSchema({ target: origin, headers, signal });

  if (!discovered.found) {
    return {
      success: false,
      resources: [],

      error: discovered.message ?? 'No discovery document found',
    };
  }

  const resources: DiscoveredResource[] = discovered.endpoints.flatMap(endpoint => {
    try {
      const url = new URL(endpoint.path, discovered.origin).toString();
      return [{ url, method: endpoint.method }];
    } catch {
      return [];
    }
  });

  if (resources.length === 0) {
    return {
      success: false,
      resources: [],
      error: 'No x402 endpoints found',
    };
  }

  return {
    success: true,
    source: mapSourceToDiscoverySource(discovered.source),
    resources,
    ...(discovered.ownershipProofs ? { ownershipProofs: discovered.ownershipProofs } : {}),
  };
}
