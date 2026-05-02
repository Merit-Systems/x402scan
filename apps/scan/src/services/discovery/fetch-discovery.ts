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

  const resources: DiscoveredResource[] = discovered.endpoints.flatMap(
    endpoint => {
      try {
        // OpenAPI-style paths like `/api/token-safety/{mint}` come back
        // with the template literal intact — `@agentcash/discovery`
        // doesn't substitute parameter examples, and `new URL()` just
        // URL-encodes the braces, producing uncallable URLs like
        // `.../%7Bmint%7D`. Skip these so we don't pollute the
        // resources table with rows that can't be probed or invoked
        // from the composer. Templated routes can still be registered
        // via per-resource registration with the substituted URL.
        if (/\{[^/}]+\}/.test(endpoint.path)) {
          return [];
        }
        const url = new URL(endpoint.path, discovered.origin).toString();
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
    ownershipProofs: discovered.ownershipProofs ?? [],
  };
}
