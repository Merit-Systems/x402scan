import { discoverOriginSchema, GuidanceMode } from '@agentcash/discovery';

import { getOriginFromUrl } from '@/lib/url';
import { isLocalUrl } from '@/lib/url-helpers';
import { templatizePath } from '@/lib/discovery/path-template';

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

  // Always request the doc-level guidance text — we mine it for canonical
  // path templates (e.g. war-tracker's `/region/{slug}`, `/country/{iso2}`).
  const discovered = await discoverOriginSchema({
    target: origin,
    headers,
    signal,
    guidance: GuidanceMode.Always,
  });

  if (!discovered.found) {
    return {
      success: false,
      resources: [],

      error: discovered.message ?? 'No discovery document found',
    };
  }

  const guidance = discovered.guidance;
  const resources: DiscoveredResource[] = discovered.endpoints.flatMap(
    endpoint => {
      try {
        const url = new URL(endpoint.path, discovered.origin).toString();
        const canonicalUrl = templatizePath(url, {
          operationSummary: endpoint.summary,
          ...(guidance ? { guidance } : {}),
        });
        return [
          {
            url,
            ...(canonicalUrl !== url ? { canonicalUrl } : {}),
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
    ownershipProofs: discovered.ownershipProofs ?? [],
  };
}
