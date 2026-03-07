import {
  discoverOriginSchema,
  getOpenAPI,
  getWellKnown,
  getWarningsForOpenAPI,
  getWarningsForWellKnown,
} from '@agentcash/discovery';
import type { AuditWarning, OpenApiSource, WellKnownSource } from '@agentcash/discovery';

import { getOriginFromUrl } from '@/lib/url';
import { isLocalUrl } from '@/lib/url-helpers';

import type {
  DiscoveredResource,
  DiscoverySource,
  X402DiscoveryResult,
} from '@/types/discovery';

const FETCH_TIMEOUT_MS = 10000;
const VALID_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

function isDiscoveredMethod(
  method: string
): method is NonNullable<DiscoveredResource['method']> {
  return VALID_METHODS.has(method);
}

function mapSourceToDiscoverySource(
  source: string | undefined
): DiscoverySource | undefined {
  if (!source) return undefined;
  if (source === 'openapi' || source === 'override') return 'openapi';
  if (source === 'well-known/x402' || source === 'well-known') return 'well-known';
  if (source === 'dns/_x402' || source === 'dns') return 'dns';
  if (source === 'probe') return 'probe';
  if (source === 'interop/mpp' || source === 'interop-mpp') return 'interop-mpp';
  return undefined;
}

function resolveErrorMessage(warnings: AuditWarning[]): string {
  const relevant = warnings.filter(
    w => w.severity === 'error' || w.severity === 'warn'
  );
  if (relevant.length === 0) return 'No discovery document found';
  return relevant
    .slice(0, 3)
    .map(w => w.message)
    .join('; ');
}

function getOwnershipProofsFromOpenApi(
  openApi: OpenApiSource | null
): string[] {
  if (!openApi?.raw) return [];

  const document = openApi.raw;
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
  wellKnown: WellKnownSource | null
): string[] {
  if (!wellKnown?.raw) return [];

  const proofs = new Set<string>();
  const raw = wellKnown.raw;

  // Top-level ownershipProofs on the well-known document
  const topLevel = raw['ownershipProofs'];
  if (Array.isArray(topLevel)) {
    for (const proof of topLevel) {
      if (typeof proof === 'string') proofs.add(proof);
    }
  }

  // Per-route ownershipProofs (well-known may embed proofs per route)
  const routes = raw['routes'];
  if (Array.isArray(routes)) {
    for (const route of routes) {
      if (!route || typeof route !== 'object' || Array.isArray(route)) continue;
      const routeProofs = (route as Record<string, unknown>).ownershipProofs;
      if (!Array.isArray(routeProofs)) continue;
      for (const proof of routeProofs) {
        if (typeof proof === 'string') proofs.add(proof);
      }
    }
  }

  return [...proofs];
}

function collectOwnershipProofs(
  openApi: OpenApiSource | null,
  wellKnown: WellKnownSource | null
): string[] {
  const all = new Set<string>([
    ...getOwnershipProofsFromOpenApi(openApi),
    ...getOwnershipProofsFromWellKnown(wellKnown),
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

  const signal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
  const headers: Record<string, string> = bustCache
    ? { 'Cache-Control': 'no-cache, no-store' }
    : {};

  // Run discovery and raw source fetches in parallel.
  // discoverOriginSchema handles all stages (openapi, well-known, probe, dns).
  // getOpenAPI/getWellKnown are called separately to access raw documents
  // for ownership proof extraction and fetchedUrl collection.
  const [discoveryOutcome, openApiOutcome, wellKnownOutcome] =
    await Promise.allSettled([
      discoverOriginSchema({ target: origin, headers, signal }),
      getOpenAPI(origin, headers, signal),
      getWellKnown(origin, headers, signal),
    ]);

  const openApi =
    openApiOutcome.status === 'fulfilled' && openApiOutcome.value.isOk()
      ? openApiOutcome.value.value
      : null;
  const wellKnown =
    wellKnownOutcome.status === 'fulfilled' && wellKnownOutcome.value.isOk()
      ? wellKnownOutcome.value.value
      : null;

  const discoveryUrls: string[] = [];
  if (openApi?.fetchedUrl) discoveryUrls.push(openApi.fetchedUrl);
  if (wellKnown?.fetchedUrl) discoveryUrls.push(wellKnown.fetchedUrl);

  if (discoveryOutcome.status === 'rejected') {
    const error = discoveryOutcome.reason;
    return {
      success: false,
      resources: [],
      discoveryUrls,
      error:
        error instanceof Error && error.message.length > 0
          ? error.message
          : 'Discovery failed',
    };
  }

  const discovered = discoveryOutcome.value;

  if (!discovered.found) {
    const warnings = [
      ...getWarningsForOpenAPI(openApi),
      ...getWarningsForWellKnown(wellKnown),
    ];
    return {
      success: false,
      resources: [],
      discoveryUrls,
      error: resolveErrorMessage(warnings),
    };
  }

  const deduped = new Map<string, DiscoveredResource>();
  for (const endpoint of discovered.endpoints) {
    let normalized: string;
    try {
      normalized = new URL(endpoint.path, discovered.origin).toString();
    } catch {
      continue;
    }
    const method = isDiscoveredMethod(endpoint.method)
      ? endpoint.method
      : undefined;

    if (!deduped.has(normalized)) {
      deduped.set(normalized, {
        url: normalized,
        ...(method ? { method } : {}),
      });
    }
  }

  const resources = [...deduped.values()];
  if (resources.length === 0) {
    const warnings = [
      ...getWarningsForOpenAPI(openApi),
      ...getWarningsForWellKnown(wellKnown),
    ];
    return {
      success: false,
      resources: [],
      discoveryUrls,
      error: resolveErrorMessage(warnings),
    };
  }

  return {
    success: true,
    source: mapSourceToDiscoverySource(discovered.source),
    resources,
    discoveryUrls,
    ownershipProofs: collectOwnershipProofs(openApi, wellKnown),
  };
}
