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

  const discovered = await discoverOriginSchema({
    target: origin,
    headers,
    signal,
  });

  if (!discovered.found) {
    return {
      success: false,
      resources: [],

      error: discovered.message ?? 'No discovery document found',
    };
  }

  const expectedOrigin = new URL(discovered.origin).origin;
  const resources: DiscoveredResource[] = discovered.endpoints.flatMap(
    endpoint => {
      try {
        const url = new URL(endpoint.path, discovered.origin).toString();
        // Security: reject endpoints that resolve to a different origin.
        // A malicious OpenAPI spec could contain absolute URLs pointing
        // elsewhere (new URL('https://evil.com/x', base) ignores the base).
        if (new URL(url).origin !== expectedOrigin) return [];
        return [
          {
            url,
            method: endpoint.method,
            ...(endpoint.authMode ? { authMode: endpoint.authMode } : {}),
          },
        ];
      } catch {
        return [];
      }
    }
  );

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
    ...(discovered.info ? { info: discovered.info } : {}),
    ownershipProofs: discovered.ownershipProofs ?? [],
  };
}
