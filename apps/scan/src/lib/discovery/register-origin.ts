import { probeX402Endpoint } from './probe';
import { getCachedProbeResult } from './probe-cache';
import { getRegistrationErrorMessage } from './utils';
import { registerResource, registerSiwxResource } from '@/lib/resources';
import { deprecateStaleResources } from '@/services/db/resources/resource';
import { getOriginResourceCount } from '@/services/db/resources/origin';
import { notifyNewServer } from '@/lib/discord-notifications';
import { getOriginFromUrl, normalizeResourceUrl } from '@/lib/url';
import { scanDb } from '@x402scan/scan-db';

import type {
  AuditWarning,
  AuthMode,
  EndpointMethodAdvisory,
} from '@agentcash/discovery';

const BULK_REGISTER_CONCURRENCY = 6;

async function mapSettledWithConcurrency<T, R>(
  items: T[],
  mapper: (item: T, index: number) => Promise<R>,
  concurrency = BULK_REGISTER_CONCURRENCY
): Promise<PromiseSettledResult<R>[]> {
  const results: (PromiseSettledResult<R> | undefined)[] = Array.from({
    length: items.length,
  });
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const current = nextIndex;
      nextIndex += 1;

      if (current >= items.length) return;
      const item = items[current] as T;

      try {
        const value = await mapper(item, current);
        results[current] = { status: 'fulfilled', value };
      } catch (reason) {
        results[current] = { status: 'rejected', reason };
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  );

  return results.map((result, index) => {
    if (!result) {
      return {
        status: 'rejected',
        reason: new Error(`Missing result at index ${index}`),
      };
    }
    return result;
  });
}

export interface RegisterOriginResult {
  registered: number;
  siwx: number;
  failed: number;
  skipped: number;
  deprecated: number;
  total: number;
  source: string | undefined;
  failedDetails: { url: string; error: string; status?: number }[];
  siwxDetails: { url: string }[];
  skippedDetails: { url: string; error: string; status?: number }[];
  warningDetails: {
    url: string;
    warnings: { code: string; severity: string; message: string }[];
  }[];
  originId: string | undefined;
}

/**
 * Probe and register all resources from a discovery document.
 * Paid resources are probed and written to the resources table.
 * SIWX (free) resources are written to the resources table without probing
 * (they have no x402 payment options — just a Resource row, no Accepts).
 * Endpoints missing an input schema are reported as skipped.
 * Deprecates resources from the same origin that are no longer in the list.
 *
 * `originInfo` is the OpenAPI `info` block (title/description/version) when
 * discovery sourced it from /openapi.json. It backstops origin metadata for
 * APIs whose homepage isn't HTML, so the scraper has nothing to extract.
 */
export async function registerResourcesFromDiscovery(
  resources: {
    url: string;
    method?: string;
    authMode?: AuthMode;
    pricingMode?: string;
    price?: string;
  }[],
  source: string | undefined,
  originInfo?: { title: string; description?: string },
  /** Server-side probe session ID. URLs with a cached probe result in Redis
   *  skip re-probing — avoids rate limiting on registration. */
  probeSessionId?: string
): Promise<RegisterOriginResult> {
  const uniqueOrigins = [
    ...new Set(resources.map(resource => getOriginFromUrl(resource.url))),
  ];

  const originResourceCounts = new Map(
    await Promise.all(
      uniqueOrigins.map(
        async origin => [origin, await getOriginResourceCount(origin)] as const
      )
    )
  );

  // Pre-create origin rows outside transactions to prevent P2002 races.
  // When multiple resources from the same origin register concurrently,
  // each transaction's resourceOrigin.upsert() can race on INSERT.
  // Top-level upserts use native INSERT ON CONFLICT, which is safe.
  await Promise.all(
    uniqueOrigins.map(origin =>
      scanDb.resourceOrigin.upsert({
        where: { origin },
        create: { origin },
        update: {},
      })
    )
  );

  async function registerAsSiwx(
    resourceUrl: string,
    pricingMode?: string,
    price?: string,
    method?: string
  ) {
    const siwxResult = await registerSiwxResource(resourceUrl, {
      method,
      originMetadataFallback: originInfo,
      pricingMode,
      price,
    });
    return siwxResult.success
      ? {
          success: true as const,
          siwx: true as const,
          url: resourceUrl,
          resource: siwxResult.resource,
        }
      : {
          success: false as const,
          url: resourceUrl,
          error: siwxResult.error,
        };
  }

  const SKIP_AUTH_MODES = new Set(['unprotected', 'apiKey']);

  const results = await mapSettledWithConcurrency(resources, async resource => {
    const resourceUrl = resource.url;

    if (resource.authMode && SKIP_AUTH_MODES.has(resource.authMode)) {
      return {
        success: false as const,
        url: resourceUrl,
        error: 'Non-registrable endpoint',
        skipped: true as const,
      };
    }

    if (resource.authMode === 'siwx') {
      return registerAsSiwx(
        resourceUrl,
        resource.pricingMode,
        resource.price,
        resource.method
      );
    }

    // Check server-side probe cache (from the batch test). This skips
    // re-probing and avoids rate limiting. The cache is server-authoritative
    // — advisory data never round-trips through the client.
    const cached = probeSessionId
      ? await getCachedProbeResult(probeSessionId, resourceUrl)
      : null;
    let advisory: EndpointMethodAdvisory;
    let probeWarnings: AuditWarning[] = [];

    if (cached) {
      advisory = cached.advisory;
      probeWarnings = cached.warnings;
    } else {
      const probeResult = await probeX402Endpoint(resourceUrl, resource.method);

      if (!probeResult.success) {
        return {
          success: false as const,
          url: resourceUrl,
          error: probeResult.error,
          ...(probeResult.skipped ? { skipped: true as const } : {}),
          ...(probeResult.statusCode !== undefined
            ? { status: probeResult.statusCode }
            : {}),
        };
      }

      advisory = probeResult.advisory;

      // Drop discovery-level schema warnings superseded by other checks.
      probeWarnings = probeResult.warnings.filter(w => {
        if (w.code === 'SCHEMA_INPUT_MISSING' && advisory.inputSchema)
          return false;
        if (w.code === 'SCHEMA_OUTPUT_MISSING') return false;
        return true;
      });
    }

    // v1 rejection is handled inside registerResource() — no duplicate check needed here.

    if (advisory.authMode === 'siwx') {
      return registerAsSiwx(
        resourceUrl,
        resource.pricingMode,
        resource.price,
        resource.method
      );
    }

    const result = await registerResource(resourceUrl, advisory, {
      notifyNewServer: false,
      originMetadataFallback: originInfo,
      warnings: probeWarnings,
      pricingMode: resource.pricingMode,
      price: resource.price,
      method: resource.method,
    });

    if (result.success) return result;

    return {
      success: false as const,
      url: resourceUrl,
      error: getRegistrationErrorMessage(result.error),
    };
  });

  const successfulResults: {
    url: string;
    method: string;
    originId: string;
    title: string | null;
    description: string | null;
  }[] = [];
  const siwxResults: { url: string; method: string }[] = [];
  const failedResults: { url: string; error: string; status?: number }[] = [];
  const skippedResults: { url: string; error: string; status?: number }[] = [];
  const warningResults: {
    url: string;
    warnings: { code: string; severity: string; message: string }[];
  }[] = [];
  let originId: string | undefined;

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const resourceUrl = resources[i]?.url ?? 'unknown';
    const resourceMethod = resources[i]?.method ?? 'GET';

    if (!result) continue;

    if (result.status === 'fulfilled' && result.value) {
      const value = result.value;
      if ('success' in value && value.success) {
        if ('siwx' in value && value.siwx === true) {
          siwxResults.push({ url: resourceUrl, method: resourceMethod });
          // Extract originId from SIWX registration result
          if (!originId && 'resource' in value && value.resource?.origin?.id) {
            originId = value.resource.origin.id;
          }
        } else if ('resource' in value) {
          successfulResults.push({
            url: resourceUrl,
            method: resourceMethod,
            originId: value.resource.origin.id,
            title: value.registrationDetails.originMetadata.title ?? null,
            description:
              value.registrationDetails.originMetadata.description ?? null,
          });
          if (!originId && 'resource' in value && value.resource?.origin?.id) {
            originId = value.resource.origin.id;
          }
          if (
            'warnings' in value &&
            Array.isArray(value.warnings) &&
            value.warnings.length > 0
          ) {
            warningResults.push({
              url: resourceUrl,
              warnings: value.warnings.map(
                (w: { code: string; severity: string; message: string }) => ({
                  code: w.code,
                  severity: w.severity,
                  message: w.message,
                })
              ),
            });
          }
        }
      } else if (
        'success' in value &&
        !value.success &&
        'skipped' in value &&
        value.skipped === true
      ) {
        skippedResults.push({
          url: resourceUrl,
          error: value.error,
          status:
            'status' in value && typeof value.status === 'number'
              ? value.status
              : undefined,
        });
      } else if ('success' in value && !value.success) {
        failedResults.push({
          url: resourceUrl,
          error: value.error,
          status:
            'status' in value && typeof value.status === 'number'
              ? value.status
              : undefined,
        });
      }
    } else if (result.status === 'rejected') {
      failedResults.push({
        url: resourceUrl,
        error:
          result.reason instanceof Error
            ? result.reason.message
            : 'Promise rejected',
      });
    }
  }

  let deprecated = 0;
  if (originId) {
    // Build active list directly from successful registration results.
    // Don't re-derive from the discovery input — it includes unprotected
    // endpoints that share a URL with a registered endpoint (e.g. GET /campaigns
    // is unprotected but POST /campaigns is paid).
    const activeResources = [
      ...successfulResults.map(r => ({
        url: normalizeResourceUrl(r.url),
        method: r.method,
      })),
      ...siwxResults.map(r => ({
        url: normalizeResourceUrl(r.url),
        method: r.method,
      })),
    ];
    deprecated = await deprecateStaleResources(originId, activeResources);
  }

  const notifiedOrigins = new Set<string>();
  for (const result of successfulResults) {
    const origin = getOriginFromUrl(result.url);

    if (
      originResourceCounts.get(origin) === 0 &&
      !notifiedOrigins.has(origin)
    ) {
      notifyNewServer({
        originId: result.originId,
        origin,
        title: result.title,
        description: result.description,
      });
      notifiedOrigins.add(origin);
    }
  }

  return {
    registered: successfulResults.length,
    siwx: siwxResults.length,
    failed: failedResults.length,
    skipped: skippedResults.length,
    deprecated,
    total: results.length,
    source,
    failedDetails: failedResults,
    siwxDetails: siwxResults,
    skippedDetails: skippedResults,
    warningDetails: warningResults,
    originId,
  };
}
