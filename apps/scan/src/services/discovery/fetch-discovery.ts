import dns from 'node:dns';
import { discoverDetailed } from '@agentcash/discovery';

import { getOriginFromUrl } from '@/lib/url';
import { isLocalUrl } from '@/lib/url-helpers';

import type {
  DiscoveredResource,
  DiscoverySource,
  X402DiscoveryResult,
} from '@/types/discovery';
import type {
  DiscoverDetailedResult,
  DiscoveryStage,
  DiscoveryWarning,
  RawSources,
} from '@agentcash/discovery';

const FETCH_TIMEOUT_MS = 10000;
const VALID_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

function isDiscoveredMethod(
  method: string
): method is NonNullable<DiscoveredResource['method']> {
  return VALID_METHODS.has(method);
}

function mapStageToSource(
  stage: DiscoveryStage | undefined
): DiscoverySource | undefined {
  if (!stage) return undefined;
  if (stage === 'openapi' || stage === 'override') return 'openapi';
  if (stage === 'well-known/x402') return 'well-known';
  if (stage === 'dns/_x402') return 'dns';
  if (stage === 'probe') return 'probe';
  if (stage === 'interop/mpp') return 'interop-mpp';
  return undefined;
}

function resolveErrorMessage(warnings: DiscoveryWarning[]): string {
  const relevant = warnings.filter(
    w => w.severity === 'error' || w.severity === 'warn'
  );
  if (relevant.length === 0) return 'No discovery document found';
  return relevant
    .slice(0, 3)
    .map(w => w.message)
    .join('; ');
}

function toDiscoveredResources(
  result: DiscoverDetailedResult
): DiscoveredResource[] {
  const deduped = new Map<string, DiscoveredResource>();

  for (const resource of result.resources) {
    let normalized: string;
    try {
      normalized = new URL(resource.path, resource.origin).toString();
    } catch {
      continue;
    }
    const method = isDiscoveredMethod(resource.method)
      ? resource.method
      : undefined;

    if (!deduped.has(normalized)) {
      deduped.set(normalized, {
        url: normalized,
        ...(method ? { method } : {}),
      });
    }
  }

  return [...deduped.values()];
}

function collectDiscoveryUrls(result: DiscoverDetailedResult): string[] {
  const urls = new Set<string>();

  for (const trace of result.trace) {
    if (trace.links?.openapiUrl) urls.add(trace.links.openapiUrl);
    if (trace.links?.wellKnownUrl) urls.add(trace.links.wellKnownUrl);
    if (trace.links?.discoveryUrl) urls.add(trace.links.discoveryUrl);
  }

  for (const resource of result.resources) {
    if (resource.links?.openapiUrl) urls.add(resource.links.openapiUrl);
    if (resource.links?.wellKnownUrl) urls.add(resource.links.wellKnownUrl);
    if (resource.links?.discoveryUrl) urls.add(resource.links.discoveryUrl);
  }

  return [...urls];
}

function getOwnershipProofsFromOpenApi(
  rawSources: RawSources | undefined
): string[] {
  if (!rawSources?.openapi || typeof rawSources.openapi !== 'object') return [];

  const document = rawSources.openapi as Record<string, unknown>;
  const discovery = document['x-discovery'];
  if (discovery && typeof discovery === 'object' && !Array.isArray(discovery)) {
    const proofs = (discovery as Record<string, unknown>).ownershipProofs;
    if (Array.isArray(proofs)) {
      return proofs.filter(
        (entry): entry is string => typeof entry === 'string'
      );
    }
  }

  const legacy = document['x-agentcash-provenance'];
  if (legacy && typeof legacy === 'object' && !Array.isArray(legacy)) {
    const proofs = (legacy as Record<string, unknown>).ownershipProofs;
    if (Array.isArray(proofs)) {
      return proofs.filter(
        (entry): entry is string => typeof entry === 'string'
      );
    }
  }

  return [];
}

function getOwnershipProofsFromWellKnown(
  rawSources: RawSources | undefined
): string[] {
  if (!Array.isArray(rawSources?.wellKnownX402)) return [];

  const proofs = new Set<string>();
  for (const payload of rawSources.wellKnownX402) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload))
      continue;
    const ownershipProofs = (payload as Record<string, unknown>)
      .ownershipProofs;
    if (!Array.isArray(ownershipProofs)) continue;
    for (const proof of ownershipProofs) {
      if (typeof proof === 'string') proofs.add(proof);
    }
  }

  return [...proofs];
}

function collectOwnershipProofs(rawSources: RawSources | undefined): string[] {
  const all = new Set<string>([
    ...getOwnershipProofsFromOpenApi(rawSources),
    ...getOwnershipProofsFromWellKnown(rawSources),
  ]);
  return [...all];
}

/**
 * Fetch discovery data for an origin using @agentcash/discovery.
 *
 * This is the canonical x402scan discovery path:
 * openapi.json -> /.well-known/x402 (compat) -> DNS _x402 (compat).
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
      discoveryUrls: [],
      error: 'Local URLs are not supported',
    };
  }

  const txtResolver = async (fqdn: string): Promise<string[]> => {
    try {
      const records = await dns.promises.resolveTxt(fqdn);
      return records.map(parts => parts.join(''));
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === 'ENODATA' || code === 'ENOTFOUND') {
        return [];
      }
      throw error;
    }
  };

  const discovered = await discoverDetailed({
    target: origin,
    compatMode: 'on',
    rawView: 'full',
    txtResolver,
    fetcher: async (input, init) => {
      const url =
        input instanceof URL
          ? new URL(input.toString())
          : typeof input === 'string'
            ? new URL(input)
            : new URL(input.url);
      const method = (init?.method ?? 'GET').toUpperCase();

      if (bustCache && method === 'GET') {
        url.searchParams.set('_t', Date.now().toString());
      }

      return fetch(url, {
        ...init,
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        cache: bustCache ? 'no-store' : init?.cache,
      });
    },
  });

  const resources = toDiscoveredResources(discovered);
  if (resources.length === 0) {
    return {
      success: false,
      resources: [],
      discoveryUrls: collectDiscoveryUrls(discovered),
      error: resolveErrorMessage(discovered.warnings),
    };
  }

  return {
    success: true,
    source: mapStageToSource(discovered.selectedStage),
    resources,
    discoveryUrls: collectDiscoveryUrls(discovered),
    ownershipProofs: collectOwnershipProofs(discovered.rawSources),
  };
}
