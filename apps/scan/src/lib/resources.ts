import { scrapeOriginData } from '@/services/scraper';
import { upsertResource } from '@/services/db/resources/resource';
import {
  getOriginResourceCount,
  upsertOrigin,
} from '@/services/db/resources/origin';

import type {
  EndpointMethodAdvisory,
  AuditWarning,
} from '@agentcash/discovery';
import { isX402PaymentOption } from '@/lib/discovery/utils';

import { getOriginFromUrl, normalizeResourceUrl } from '@/lib/url';

import { upsertResourceResponse } from '@/services/db/resources/response';
import { formatTokenAmount } from './token';
import { SUPPORTED_CHAINS } from '@/types/chain';
import { fetchDiscoveryDocument } from '@/services/discovery';
import { verifyAcceptsOwnership } from '@/services/verification/accepts-verification';
import { outputSchemaV1 } from '@/lib/x402/v1';
import {
  normalizeChainId,
  parseX402Response,
  getOutputSchema,
  type ParsedX402Response,
} from '@/lib/x402';

import { scanDb } from '@x402scan/scan-db';
import type { AcceptsNetwork } from '@x402scan/scan-db';

import { convertOpenApiSchemaToV1 } from '@/lib/openapi-to-v1';
import { deduplicateWarnings } from '@/lib/discovery/utils';
import { notifyNewServer } from '@/lib/discord-notifications';
import { after } from 'next/server';

/**
 * Pure validation — no DB writes, no side effects. Used by both
 * registerResource() and the batch-test endpoint so the pre-registration
 * count matches the actual registration outcome.
 */
export function validateResource(
  url: string,
  advisory: EndpointMethodAdvisory
): { valid: true; warnings: AuditWarning[] } | { valid: false; error: string } {
  const warnings: AuditWarning[] = [];

  // HTTPS enforcement (allow localhost / 127.0.0.1 for dev)
  const urlObj = new URL(url);
  if (
    urlObj.protocol === 'http:' &&
    urlObj.hostname !== 'localhost' &&
    urlObj.hostname !== '127.0.0.1'
  ) {
    return {
      valid: false,
      error: 'HTTPS is required for x402 resource registration',
    };
  }

  // v1 rejection — only v2 resources can be registered
  const x402Options = (advisory.paymentOptions ?? []).filter(
    isX402PaymentOption
  );
  const hasOnlyV1 =
    x402Options.length > 0 && x402Options.every(o => o.version === 1);
  if (hasOnlyV1) {
    return {
      valid: false,
      error: 'x402 v1 response detected — migrate to v2 spec',
    };
  }

  // No x402 payment options
  if (x402Options.length === 0) {
    return { valid: false, error: 'No x402 payment options found' };
  }

  // Missing input schema — check advisory.inputSchema first, then fall back to
  // the bazaar extension in the raw 402 body. The discovery package doesn't
  // always extract schemas from bazaar, but the data is often there.
  if (!advisory.inputSchema) {
    let hasBazaarSchema = false;
    if (
      advisory.paymentRequiredBody &&
      typeof advisory.paymentRequiredBody === 'object' &&
      advisory.paymentRequiredBody !== null
    ) {
      try {
        const parsed = parseX402Response(advisory.paymentRequiredBody);
        if (parsed.success) {
          const extracted = getOutputSchema(parsed.data);
          hasBazaarSchema = !!extracted;
        }
      } catch {
        // Malformed bazaar data — treat as missing schema
      }
    }
    if (!hasBazaarSchema) {
      return {
        valid: false,
        error:
          'Missing input schema — add a requestBody or parameter schema to your OpenAPI spec so agents know what to send',
      };
    }
  }

  // Unsupported networks
  const hasSupported = x402Options.some(opt =>
    (SUPPORTED_CHAINS as readonly string[]).includes(
      normalizeChainId(opt.network)
    )
  );
  if (!hasSupported) {
    const advertisedNetworks = Array.from(
      new Set(x402Options.map(o => normalizeChainId(o.network)))
    );
    return {
      valid: false,
      error: `No supported networks. Got: [${advertisedNetworks.join(', ')}]. Supported: [${(SUPPORTED_CHAINS as readonly string[]).join(', ')}]`,
    };
  }

  // Missing output schema — endpoint works but agents won't know what it returns
  if (!advisory.outputSchema) {
    let hasBazaarOutputSchema = false;
    if (
      advisory.paymentRequiredBody &&
      typeof advisory.paymentRequiredBody === 'object' &&
      advisory.paymentRequiredBody !== null
    ) {
      try {
        const parsed = parseX402Response(advisory.paymentRequiredBody);
        if (parsed.success) {
          const extracted = getOutputSchema(parsed.data);
          hasBazaarOutputSchema = !!extracted;
        }
      } catch {
        // Malformed bazaar data
      }
    }
    if (!hasBazaarOutputSchema) {
      warnings.push({
        code: 'MISSING_OUTPUT_SCHEMA',
        severity: 'warn',
        message:
          'Missing output schema — add a response schema to your OpenAPI spec so agents know what this endpoint returns',
      });
    }
  }

  return { valid: true, warnings };
}

/**
 * Register a SIWX (free, identity-gated) endpoint. These endpoints have no
 * x402 payment options, no 402 response body, and no Accepts records — just
 * a Resource row linked to its Origin.
 */
export async function registerSiwxResource(
  url: string,
  options: {
    method?: string;
    originMetadataFallback?: { title?: string; description?: string };
    pricingMode?: string;
    price?: string;
    /** Skip metadata scrape+upsert — caller handles it (e.g. batch registration). */
    skipMetadataScrape?: boolean;
  } = {}
) {
  const urlObj = new URL(url);
  if (
    urlObj.protocol === 'http:' &&
    urlObj.hostname !== 'localhost' &&
    urlObj.hostname !== '127.0.0.1'
  ) {
    return {
      success: false as const,
      error: 'HTTPS is required for resource registration',
    };
  }

  const cleanUrl = normalizeResourceUrl(url);
  const origin = getOriginFromUrl(cleanUrl);

  try {
    const resource = await scanDb.$transaction(async tx => {
      await tx.resourceOrigin.upsert({
        where: { origin },
        create: { origin },
        update: {},
      });

      const siwxMetadata = {
        authMode: 'siwx' as const,
        ...(options.pricingMode ? { pricingMode: options.pricingMode } : {}),
        ...(options.price ? { price: options.price } : {}),
      };

      // Merge with existing metadata to avoid clobbering fields set by
      // a different registration path (e.g. paid sets pricingMode on the
      // same URL-keyed row).
      const method = options.method ?? '';
      const existing = await tx.resources.findUnique({
        where: {
          resource_method: { resource: cleanUrl, method },
        },
        select: { metadata: true },
      });
      const mergedMetadata =
        existing?.metadata &&
        typeof existing.metadata === 'object' &&
        !Array.isArray(existing.metadata)
          ? { ...existing.metadata, ...siwxMetadata }
          : siwxMetadata;

      return tx.resources.upsert({
        where: {
          resource_method: { resource: cleanUrl, method },
        },
        create: {
          resource: cleanUrl,
          method,
          type: 'http',
          x402Version: 0,
          lastUpdated: new Date(),
          metadata: siwxMetadata,
          origin: { connect: { origin } },
        },
        update: {
          type: 'http',
          x402Version: 0,
          lastUpdated: new Date(),
          metadata: mergedMetadata,
          deprecatedAt: null,
          origin: { connect: { origin } },
        },
        include: { origin: true },
      });
    });

    // Scrape and upsert origin metadata. Resource is already persisted, so
    // a scrape failure won't fail the registration.
    // Skipped in batch registration where the caller deduplicates per origin.
    if (!options.skipMetadataScrape) {
      try {
        const { og, metadata, favicon } = await scrapeOriginData(origin);
        const title =
          metadata?.title ??
          og?.ogTitle ??
          options.originMetadataFallback?.title ??
          null;
        const description =
          metadata?.description ??
          og?.ogDescription ??
          options.originMetadataFallback?.description ??
          null;

        await upsertOrigin({
          origin,
          title: title ?? undefined,
          description: description ?? undefined,
          favicon: favicon ?? undefined,
          ogImages:
            og?.ogImage?.flatMap(image => {
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
          '[registerSiwxResource] Metadata scrape failed (non-blocking):',
          err
        );
      }
    }

    return {
      success: true as const,
      resource: {
        id: resource.id,
        origin: { id: resource.origin.id },
      },
    };
  } catch (error) {
    // P2002: unique constraint race — another concurrent call already registered
    // the same URL (e.g. POST and DELETE on the same path). Treat as success.
    const isUniqueViolation =
      error instanceof Error &&
      'code' in error &&
      (error as { code: string }).code === 'P2002';
    if (isUniqueViolation) {
      const existing = await scanDb.resources.findUnique({
        where: {
          resource_method: {
            resource: cleanUrl,
            method: options.method ?? '',
          },
        },
        include: { origin: true },
      });
      // Record may have been deleted between the P2002 and the lookup —
      // still treat as success since the constraint proved it existed.
      return {
        success: true as const,
        resource: existing
          ? { id: existing.id, origin: { id: existing.origin.id } }
          : { id: 'race-resolved', origin: { id: 'race-resolved' } },
      };
    }
    console.error('[registerSiwxResource] Failed:', error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Database error',
    };
  }
}

export const registerResource = async (
  url: string,
  advisory: EndpointMethodAdvisory,
  options: {
    notifyNewServer?: boolean;
    /**
     * Title/description to fall back to when the origin's homepage isn't HTML
     * (so the scraper finds no <title>/meta/OG tags). Typically the OpenAPI
     * `info` block from discovery.
     */
    originMetadataFallback?: { title?: string; description?: string };
    /** Warnings from probeX402Endpoint — merged into the result. */
    warnings?: AuditWarning[];
    /** Pricing mode from discovery document ("fixed" | "dynamic"). */
    pricingMode?: string;
    /** Price string from discovery document (e.g. "50-300.00 USD"). */
    price?: string;
    /** HTTP method from discovery — preferred over advisory.method which
     *  is always POST (x402 payment protocol). */
    method?: string;
    /** Skip metadata scrape+upsert — caller handles it (e.g. batch registration). */
    skipMetadataScrape?: boolean;
  } = {}
) => {
  const validation = validateResource(url, advisory);

  if (!validation.valid) {
    return {
      success: false as const,
      data: advisory.paymentRequiredBody,
      error: {
        type: 'validation' as const,
        parseErrors: [validation.error],
      },
      warnings: [...(options.warnings ?? [])],
    };
  }

  const x402Options = (advisory.paymentOptions ?? []).filter(
    isX402PaymentOption
  );
  const warnings = deduplicateWarnings([
    ...(options.warnings ?? []),
    ...validation.warnings,
  ]);

  const cleanUrl = normalizeResourceUrl(url);
  const origin = getOriginFromUrl(cleanUrl);
  const shouldNotifyNewServer = options.notifyNewServer ?? true;

  const existingOriginResourceCount = shouldNotifyNewServer
    ? await getOriginResourceCount(origin)
    : null;

  // Try v1 parse first (works when inputSchema includes type/method)
  let outputSchemaForDb = outputSchemaV1.safeParse({
    input: advisory.inputSchema,
    output: advisory.outputSchema ?? null,
  }).data;
  let schemaSource = outputSchemaForDb ? 'v1' : undefined;

  // Fallback: use v2-aware extraction from raw 402 body
  if (!outputSchemaForDb && advisory.paymentRequiredBody) {
    const parsed = parseX402Response(advisory.paymentRequiredBody);
    if (parsed.success) {
      const extracted = getOutputSchema(parsed.data);
      if (extracted) {
        const input = extracted.input as Record<string, unknown>;
        if (!input.method && advisory.method) {
          input.method = advisory.method;
        }
        outputSchemaForDb = extracted;
        schemaSource = 'v2-bazaar';
      }
    }
  }

  // Fallback: convert raw OpenAPI-format inputSchema to v1 format.
  if (!outputSchemaForDb && advisory.inputSchema) {
    const converted = convertOpenApiSchemaToV1(
      advisory.inputSchema,
      advisory.method,
      advisory.outputSchema
    );
    if (converted) {
      outputSchemaForDb = converted;
      schemaSource = 'openapi-converted';
    }
  }

  if (!outputSchemaForDb) {
    console.warn(
      `[registerResource] No output schema resolved for ${cleanUrl}`,
      `method=${advisory.method}`,
      `hasInputSchema=${!!advisory.inputSchema}`,
      `hasPaymentBody=${!!advisory.paymentRequiredBody}`,
      `inputSchemaKeys=${advisory.inputSchema ? Object.keys(advisory.inputSchema).join(',') : 'none'}`
    );
  } else {
    console.log(
      `[registerResource] Schema resolved via ${schemaSource} for ${cleanUrl}`
    );
  }

  const allMappedAccepts = x402Options.map(opt => ({
    scheme: opt.scheme ?? 'exact',
    network: normalizeChainId(opt.network) as AcceptsNetwork,
    maxAmountRequired:
      ('amount' in opt ? opt.amount : opt.maxAmountRequired) ?? '0',
    payTo: opt.payTo ?? '',
    asset: opt.asset,
    maxTimeoutSeconds: opt.maxTimeoutSeconds ?? 60,
    outputSchema: outputSchemaForDb,
    extra: undefined,
  }));

  const mappedAccepts = allMappedAccepts.filter(accept =>
    (SUPPORTED_CHAINS as readonly string[]).includes(accept.network)
  );

  // This should never fire since validateResource already checked, but
  // guard defensively in case the chain list diverges at runtime.
  if (mappedAccepts.length === 0) {
    const advertisedNetworks = Array.from(
      new Set(allMappedAccepts.map(a => a.network))
    );
    return {
      success: false as const,
      data: advisory.paymentRequiredBody,
      error: {
        type: 'parseResponse' as const,
        parseErrors: [
          `No supported networks advertised. Got: [${advertisedNetworks.join(', ')}]. Supported: [${(SUPPORTED_CHAINS as readonly string[]).join(', ')}]. Testnets are not indexed.`,
        ],
      },
      warnings,
    };
  }

  const parsedPaymentRequiredBody = parseX402Response(
    advisory.paymentRequiredBody
  );
  if (!parsedPaymentRequiredBody.success) {
    return {
      success: false as const,
      data: advisory.paymentRequiredBody,
      error: {
        type: 'parseResponse' as const,
        parseErrors: parsedPaymentRequiredBody.errors,
      },
      warnings,
    };
  }

  const x402Version = x402Options[0]?.version ?? 1;

  const resource = await upsertResource({
    resource: cleanUrl,
    method: options.method ?? '',
    type: 'http',
    x402Version,
    lastUpdated: new Date(),
    accepts: mappedAccepts,
    ...(options.pricingMode || options.price
      ? {
          metadata: {
            ...(options.pricingMode
              ? { pricingMode: options.pricingMode }
              : {}),
            ...(options.price ? { price: options.price } : {}),
          },
        }
      : {}),
  });

  if (!resource) {
    return {
      success: false as const,
      data: advisory.paymentRequiredBody,
      error: {
        type: 'database' as const,
        upsertErrors: ['Resource failed to upsert'],
      },
      warnings,
    };
  }

  // Scrape origin metadata (title, favicon, OG images) and upsert.
  // Skipped in batch registration where the caller deduplicates per origin.
  let title: string | null = options.originMetadataFallback?.title ?? null;
  let description: string | null =
    options.originMetadataFallback?.description ?? null;
  let favicon: string | null = null;
  let og: Awaited<ReturnType<typeof scrapeOriginData>>['og'] = null;

  if (!options.skipMetadataScrape) {
    const scraped = await scrapeOriginData(origin);
    og = scraped.og;
    favicon = scraped.favicon;

    title = scraped.metadata?.title ?? og?.ogTitle ?? title;
    description =
      scraped.metadata?.description ?? og?.ogDescription ?? description;

    // Origin metadata upsert — awaited to ensure favicon URLs are persisted.
    // The origin row itself is already created inside upsertResource's
    // transaction. This enriches it with scraped metadata (title, favicon,
    // OG images). When multiple resources from the same origin register
    // concurrently, this can race (P2002) — safe to swallow since another
    // concurrent call will succeed.
    try {
      await upsertOrigin({
        origin,
        title: title ?? undefined,
        description: description ?? undefined,
        favicon: favicon ?? undefined,
        ogImages:
          og?.ogImage?.flatMap(image => {
            try {
              return [
                {
                  url: new URL(image.url, origin).toString(),
                  height: image.height,
                  width: image.width,
                  title: og?.ogTitle,
                  description: og?.ogDescription,
                },
              ];
            } catch {
              return [];
            }
          }) ?? [],
      });
    } catch (err) {
      // P2002: another concurrent call already upserted this origin — safe to ignore.
      // Log anything else so metadata failures aren't silent.
      const isP2002 =
        err instanceof Error &&
        'code' in err &&
        (err as { code: string }).code === 'P2002';
      if (!isP2002) {
        console.error('[registerResource] Origin metadata upsert failed:', err);
      }
    }
  }

  await upsertResourceResponse(
    resource.resource.id,
    (advisory.paymentRequiredBody ?? {}) as ParsedX402Response
  );

  if (existingOriginResourceCount === 0) {
    notifyNewServer({
      originId: resource.origin.id,
      origin,
      title: title ?? null,
      description: description ?? null,
    });
  }

  // Attempt ownership verification (non-blocking)
  const ownershipTask = async () => {
    try {
      const discoveryResult = await fetchDiscoveryDocument(origin);
      if (
        discoveryResult.success &&
        discoveryResult.ownershipProofs &&
        discoveryResult.ownershipProofs.length > 0
      ) {
        const acceptIds = resource.accepts.map(accept => accept.id);
        await verifyAcceptsOwnership({
          acceptIds,
          ownershipProofs: discoveryResult.ownershipProofs,
          origin,
        });
      }
    } catch (error) {
      console.error(
        'Ownership verification failed during registration:',
        error
      );
    }
  };
  try {
    after(ownershipTask);
  } catch {
    void ownershipTask();
  }

  return {
    success: true as const,
    resource,
    accepts: resource.accepts.map(accept => ({
      ...accept,
      maxAmountRequired: formatTokenAmount(accept.maxAmountRequired),
    })),
    response: advisory.paymentRequiredBody,
    warnings,
    registrationDetails: {
      providedAccepts: mappedAccepts,
      supportedAccepts: resource.accepts,
      unsupportedAccepts: resource.unsupportedAccepts,
      originMetadata: {
        title,
        description,
        favicon: favicon ?? null,
        ogImages:
          og?.ogImage?.map(image => ({
            url: image.url,
            height: image.height,
            width: image.width,
          })) ?? [],
      },
    },
  };
};
