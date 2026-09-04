import { isOpenApiDeclaredFree } from "./catalog-auth";
import { probeX402Endpoint } from "./probe";
import { getCachedProbeResult } from "./probe-cache";
import { getRegistrationErrorMessage } from "./utils";
import { registerResource, registerFreeResource } from "@/lib/resources";
import { deprecateStaleResources } from "@/services/db/resources/resource";
import {
  getOriginResourceCount,
  upsertOrigin,
} from "@/services/db/resources/origin";
import { notifyNewServer } from "@/lib/discord-notifications";
import { getOriginFromUrl, normalizeResourceUrl } from "@/lib/url";
import { scrapeOriginData } from "@/services/scraper";

import type { FreeAuthMode } from "@/lib/resource-auth";
import type {
  AuditWarning,
  AuthMode,
  EndpointMethodAdvisory,
} from "@agentcash/discovery";

const BULK_REGISTER_CONCURRENCY = 6;

/** Failed outcome of a single resource registration attempt. */
interface FailedRegistrationOutcome {
  success: false;
  url: string;
  error: string;
  skipped?: true;
  status?: number;
}

async function mapSettledWithConcurrency<T, R>(
  items: T[],
  mapper: (item: T, index: number) => Promise<R>,
  concurrency = BULK_REGISTER_CONCURRENCY
): Promise<PromiseSettledResult<R>[]> {
  const results: (PromiseSettledResult<R> | undefined)[] = Array.from({
    length: items.length,
  });
  const entries = items.entries();

  async function worker() {
    for (;;) {
      const next = entries.next();
      if (next.done) return;
      const [current, item] = next.value;

      try {
        const value = await mapper(item, current);
        results[current] = { status: "fulfilled", value };
      } catch (reason) {
        results[current] = { status: "rejected", reason };
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  );

  return results.map((result, index) => {
    if (!result) {
      return {
        status: "rejected",
        reason: new Error(`Missing result at index ${index}`),
      };
    }
    return result;
  });
}

export interface RegisterOriginResult {
  registered: number;
  siwx: number;
  /** Endpoints registered as explicitly public (`security: []` in openapi). */
  publicCount: number;
  /** Endpoints registered as apiKey-gated (declared in openapi). */
  apiKeyCount: number;
  failed: number;
  skipped: number;
  deprecated: number;
  total: number;
  source: string | undefined;
  failedDetails: { url: string; error: string; status?: number }[];
  siwxDetails: { url: string }[];
  publicDetails: { url: string }[];
  apiKeyDetails: { url: string }[];
  skippedDetails: {
    url: string;
    error: string;
    status?: number;
  }[];
  warningDetails: {
    url: string;
    warnings: { code: string; severity: string; message: string }[];
  }[];
  originId: string | undefined;
}

/**
 * Probe and register all resources from a discovery document.
 * Paid resources are probed and written to the resources table.
 * Free resources are written without probing (no x402 payment options —
 * just a Resource row, no Accepts, tagged via metadata.authMode):
 * SIWX from any source; explicitly-public (`security: []`) and apiKey
 * endpoints only when declared in openapi.json, and only alongside at
 * least one paid/SIWX resource registered in the same batch.
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
    description?: string;
  }[],
  source: string | undefined,
  originInfo?: { title: string; description?: string },
  /** Server-side probe session ID. URLs with a cached probe result in Redis
   *  skip re-probing — avoids rate limiting on registration. */
  probeSessionId?: string,
  contactEmail?: string
): Promise<RegisterOriginResult> {
  const uniqueOrigins = [
    ...new Set(resources.map((resource) => getOriginFromUrl(resource.url))),
  ];

  const originResourceCounts = new Map(
    await Promise.all(
      uniqueOrigins.map(
        async (origin) =>
          [origin, await getOriginResourceCount(origin)] as const
      )
    )
  );

  async function registerAsFree(
    resource: {
      url: string;
      method?: string;
      pricingMode?: string;
      price?: string;
      description?: string;
    },
    authMode: FreeAuthMode
  ) {
    const freeResult = await registerFreeResource(resource.url, {
      authMode,
      method: resource.method,
      originMetadataFallback: originInfo,
      pricingMode: resource.pricingMode,
      price: resource.price,
      description: resource.description,
      skipMetadataScrape: true,
    });
    return freeResult.success
      ? {
          success: true as const,
          free: true as const,
          authMode,
          url: resource.url,
          resource: freeResult.resource,
        }
      : {
          success: false as const,
          url: resource.url,
          error: freeResult.error,
        };
  }

  // Openapi-declared public (`security: []`) and apiKey endpoints become free
  // catalog rows — but only alongside payable content: they register in a
  // second pass, gated on the origin gaining at least one paid/SIWX resource
  // in THIS batch. Deliberately not "or the origin already has resources":
  // that arm would let a batch whose paid probes all failed transiently
  // register catalog rows, set originId, and deprecate every existing paid
  // row. Catalog rows alone must never create or sustain a server page.
  const catalogResources = resources.filter((r) =>
    isOpenApiDeclaredFree(r.authMode, source)
  );
  const mainResources = resources.filter(
    (r) => !isOpenApiDeclaredFree(r.authMode, source)
  );

  const mainResults = await mapSettledWithConcurrency(
    mainResources,
    async (resource) => {
      const resourceUrl = resource.url;

      // Openapi-declared free endpoints were partitioned out above — anything
      // still carrying these modes came from a source we don't trust for
      // catalog listing.
      if (resource.authMode === "unprotected") {
        return {
          success: false as const,
          url: resourceUrl,
          error: "Unprotected endpoint (no x402 paywall)",
          skipped: true as const,
        };
      }
      if (resource.authMode === "apiKey") {
        return {
          success: false as const,
          url: resourceUrl,
          error: "Non-registrable endpoint (declare it in openapi.json)",
          skipped: true as const,
        };
      }

      if (resource.authMode === "siwx") {
        return registerAsFree(resource, "siwx");
      }

      // Check server-side probe cache (from the batch test). This skips
      // re-probing and avoids rate limiting. The cache is server-authoritative
      // — advisory data never round-trips through the client.
      const cached = probeSessionId
        ? await getCachedProbeResult(probeSessionId, resourceUrl)
        : null;
      let advisory: EndpointMethodAdvisory;
      let probeWarnings: AuditWarning[];

      if (cached) {
        advisory = cached.advisory;
        probeWarnings = cached.warnings;
      } else {
        const probeResult = await probeX402Endpoint(
          resourceUrl,
          resource.method
        );

        if (!probeResult.success) {
          const failure: FailedRegistrationOutcome = {
            success: false,
            url: resourceUrl,
            error: probeResult.error,
          };
          if (probeResult.skipped) failure.skipped = true;
          if (probeResult.statusCode !== undefined) {
            failure.status = probeResult.statusCode;
          }
          return failure;
        }

        advisory = probeResult.advisory;

        // Drop discovery-level schema warnings superseded by other checks.
        probeWarnings = probeResult.warnings.filter((w) => {
          if (w.code === "SCHEMA_INPUT_MISSING" && advisory.inputSchema)
            return false;
          if (w.code === "SCHEMA_OUTPUT_MISSING") return false;
          return true;
        });
      }

      // v1 rejection is handled inside registerResource() — no duplicate check needed here.

      if (advisory.authMode === "siwx") {
        return registerAsFree(resource, "siwx");
      }

      const result = await registerResource(resourceUrl, advisory, {
        notifyNewServer: false,
        originMetadataFallback: originInfo,
        warnings: probeWarnings,
        pricingMode: resource.pricingMode,
        price: resource.price,
        description: resource.description,
        method: resource.method,
        skipMetadataScrape: true,
      });

      if (result.success) return result;

      return {
        success: false as const,
        url: resourceUrl,
        error: getRegistrationErrorMessage(result.error),
      };
    }
  );

  // Origins that gained a paid/SIWX resource in this batch — the catalog
  // gate is per origin so a success for one origin can't unlock catalog
  // rows for another.
  const succeededOrigins = new Set(
    mainResults.flatMap((r, i) =>
      r.status === "fulfilled" &&
      "success" in r.value &&
      r.value.success &&
      mainResources[i]
        ? [getOriginFromUrl(mainResources[i].url)]
        : []
    )
  );

  const catalogResults = await mapSettledWithConcurrency(
    catalogResources,
    async (resource) => {
      const origin = getOriginFromUrl(resource.url);
      if (!succeededOrigins.has(origin)) {
        return {
          success: false as const,
          url: resource.url,
          error:
            "No paid or SIWX resources registered for this origin — public/API-key endpoints are only listed alongside payable endpoints",
          skipped: true as const,
        };
      }
      return registerAsFree(
        resource,
        resource.authMode === "apiKey" ? "apiKey" : "unprotected"
      );
    }
  );

  // Collection below indexes results back to their input resource — keep the
  // two passes aligned.
  const orderedResources = [...mainResources, ...catalogResources];
  const results = [...mainResults, ...catalogResults];

  const successfulResults: {
    url: string;
    method: string;
    originId: string;
    title: string | null;
    description: string | null;
  }[] = [];
  const freeResults: {
    url: string;
    method: string;
    authMode: FreeAuthMode;
  }[] = [];
  const failedResults: { url: string; error: string; status?: number }[] = [];
  const skippedResults: {
    url: string;
    error: string;
    status?: number;
  }[] = [];
  const warningResults: {
    url: string;
    warnings: { code: string; severity: string; message: string }[];
  }[] = [];
  let originId: string | undefined;

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const resourceUrl = orderedResources[i]?.url ?? "unknown";
    const resourceMethod = orderedResources[i]?.method ?? "";

    if (!result) continue;

    if (result.status === "fulfilled") {
      const value = result.value;
      if (value.success) {
        if (!("registrationDetails" in value)) {
          freeResults.push({
            url: resourceUrl,
            method: resourceMethod,
            authMode: value.authMode,
          });
          // Extract originId from free registration result
          originId ??= value.resource.origin.id;
        } else {
          successfulResults.push({
            url: resourceUrl,
            method: resourceMethod,
            originId: value.resource.origin.id,
            title: value.registrationDetails.originMetadata.title ?? null,
            description:
              value.registrationDetails.originMetadata.description ?? null,
          });
          originId ??= value.resource.origin.id;
          if (value.warnings.length > 0) {
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
      } else if ("skipped" in value && value.skipped === true) {
        skippedResults.push({
          url: resourceUrl,
          error: value.error,
          status: "status" in value ? value.status : undefined,
        });
      } else {
        failedResults.push({
          url: resourceUrl,
          error: value.error,
          status: "status" in value ? value.status : undefined,
        });
      }
    } else {
      failedResults.push({
        url: resourceUrl,
        error:
          result.reason instanceof Error
            ? result.reason.message
            : "Promise rejected",
      });
    }
  }

  let deprecated = 0;
  if (originId) {
    // Build active list directly from successful registration results, not
    // the discovery input — skipped/failed endpoints must not keep stale
    // rows alive.
    const activeResources = [
      ...successfulResults.map((r) => ({
        url: normalizeResourceUrl(r.url),
        method: r.method,
      })),
      ...freeResults.map((r) => ({
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

  // Only scrape metadata for origins that have resources (either newly
  // registered in this batch or pre-existing). Origins where every resource
  // failed have no origin row — scraping would cause upsertOrigin to create
  // one, re-introducing the orphan problem.
  const originsWithResources = new Set(
    [...successfulResults, ...freeResults].map((r) => getOriginFromUrl(r.url))
  );
  const originsToScrape = uniqueOrigins.filter(
    (origin) =>
      originsWithResources.has(origin) ||
      (originResourceCounts.get(origin) ?? 0) > 0
  );

  // Scrape and upsert origin metadata once per unique origin (deduped).
  // Individual registerResource/registerFreeResource calls skip this
  // (skipMetadataScrape: true) so the scrape+upsert happens exactly once
  // per origin, not once per resource.
  // Awaited directly — favicon URLs are essential for rendering and must
  // be persisted before the response is sent. The previous after() approach
  // was unreliable (the deferred scrape+upsert could be killed before
  // completing, leaving stale ICO URLs in the DB).
  await Promise.all(
    originsToScrape.map(async (origin) => {
      try {
        const { og, metadata, favicon } = await scrapeOriginData(origin);
        const title =
          metadata?.title ?? og?.ogTitle ?? originInfo?.title ?? null;
        const description =
          metadata?.description ??
          og?.ogDescription ??
          originInfo?.description ??
          null;

        await upsertOrigin({
          origin,
          title: title ?? undefined,
          description: description ?? undefined,
          favicon: favicon ?? undefined,
          email: contactEmail ?? undefined,
          ogImages:
            og?.ogImage?.flatMap((image) => {
              try {
                return [
                  {
                    url: new URL(image.url, origin).toString(),
                    height: image.height,
                    width: image.width,
                    title: og.ogTitle,
                    description: og.ogDescription,
                  },
                ];
              } catch {
                return [];
              }
            }) ?? [],
        });
      } catch (err) {
        console.error(
          `[registerResourcesFromDiscovery] Metadata upsert failed for ${origin}:`,
          err
        );
      }
    })
  );

  const siwxResults = freeResults.filter((r) => r.authMode === "siwx");
  const publicResults = freeResults.filter((r) => r.authMode === "unprotected");
  const apiKeyResults = freeResults.filter((r) => r.authMode === "apiKey");

  return {
    registered: successfulResults.length,
    siwx: siwxResults.length,
    publicCount: publicResults.length,
    apiKeyCount: apiKeyResults.length,
    failed: failedResults.length,
    skipped: skippedResults.length,
    deprecated,
    total: results.length,
    source,
    failedDetails: failedResults,
    siwxDetails: siwxResults,
    publicDetails: publicResults,
    apiKeyDetails: apiKeyResults,
    skippedDetails: skippedResults,
    warningDetails: warningResults,
    originId,
  };
}
