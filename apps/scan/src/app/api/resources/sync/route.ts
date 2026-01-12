import { NextResponse } from 'next/server';

import { HTTPFacilitatorClient } from '@x402/core/http';
import { withBazaar } from '@x402/extensions/bazaar';
import { Prisma, scanDb } from '@x402scan/scan-db';
import { discoverableFacilitators } from 'facilitators';

import { checkCronSecret } from '@/lib/cron';
import { getOriginFromUrl } from '@/lib/url';
import { scrapeOriginData } from '@/services/scraper';
import { upsertResourceSchema } from '@/services/db/resources/resource';
import { SUPPORTED_CHAINS } from '@/types/chain';

import type { z } from 'zod';
import type { AcceptsNetwork } from '@x402scan/scan-db/types';
import type { SupportedChain } from '@/types/chain';
import type { NextRequest } from 'next/server';
import type { FacilitatorConfig } from 'x402/types';

// ============================================================================
// Constants
// ============================================================================

const SCRAPE_CONCURRENCY = 10;
const DB_BATCH_SIZE = 100;
const PAGE_LIMIT = 100;

// ============================================================================
// Types
// ============================================================================

interface ScrapedOrigin {
  origin: string;
  title?: string;
  description?: string;
  favicon?: string;
  ogImages: {
    url: string;
    height?: number;
    width?: number;
    title?: string;
    description?: string;
  }[];
}

interface ValidatedResource {
  parsed: z.output<typeof upsertResourceSchema>;
  originUrl: string;
}

// Resource from facilitator discovery API
interface FacilitatorResource {
  resource: string;
  type: string;
  x402Version: number;
  lastUpdated: string;
  accepts: {
    scheme: string;
    network: string;
    payTo: string;
    description: string;
    maxAmountRequired: string;
    mimeType: string;
    maxTimeoutSeconds: number;
    asset: string;
    outputSchema?: unknown;
    extra?: Record<string, unknown>;
  }[];
}

// ============================================================================
// Facilitator Resource Fetching
// ============================================================================

/**
 * Create a bazaar-enabled facilitator client
 */
function createBazaarClient(facilitator: FacilitatorConfig) {
  return withBazaar(new HTTPFacilitatorClient({ url: facilitator.url }));
}

/**
 * Fetch all resources from a single facilitator using the Bazaar extension
 */
async function fetchFacilitatorResources(
  facilitator: FacilitatorConfig
): Promise<FacilitatorResource[]> {
  const client = createBazaarClient(facilitator);
  const allResources: FacilitatorResource[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await client.extensions.discovery.listResources({
      type: 'http',
      limit: PAGE_LIMIT,
      offset,
    });

    // The response may have different shapes depending on facilitator
    // Handle both { resources } and { items } formats
    const items =
      (response as unknown as { items?: FacilitatorResource[] }).items ??
      (response.resources as unknown as FacilitatorResource[]);

    if (!items || items.length === 0) {
      hasMore = false;
      break;
    }

    allResources.push(...items);

    // Check pagination
    const total = response.total ?? 0;
    if (offset + PAGE_LIMIT >= total || items.length < PAGE_LIMIT) {
      hasMore = false;
    } else {
      offset += PAGE_LIMIT;
    }
  }

  return allResources;
}

/**
 * Fetch resources from all facilitators
 */
async function fetchAllResources(skip: string[] = []): Promise<{
  resources: FacilitatorResource[];
  errors: { facilitator: string; error: string }[];
  skippedFacilitators: string[];
}> {
  const resources: FacilitatorResource[] = [];
  const errors: { facilitator: string; error: string }[] = [];
  const skippedFacilitators: string[] = [];

  for (const facilitator of discoverableFacilitators) {
    // Check if this facilitator should be skipped
    if (
      skip.some(s => facilitator.url.toLowerCase().includes(s.toLowerCase()))
    ) {
      skippedFacilitators.push(facilitator.url);
      continue;
    }

    try {
      console.log(`[sync] Fetching from ${facilitator.url}`);
      const facilitatorResources = await fetchFacilitatorResources(facilitator);
      console.log(
        `[sync] Fetched ${facilitatorResources.length} from ${facilitator.url}`
      );
      resources.push(...facilitatorResources);
    } catch (error) {
      console.error(`[sync] Failed to fetch from ${facilitator.url}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      errors.push({
        facilitator: facilitator.url,
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  }

  return { resources, errors, skippedFacilitators };
}

// ============================================================================
// Origin Scraping
// ============================================================================

async function scrapeOriginsInBatches(
  origins: string[],
  concurrency: number
): Promise<ScrapedOrigin[]> {
  const results: ScrapedOrigin[] = [];

  for (let i = 0; i < origins.length; i += concurrency) {
    const batch = origins.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map(async (origin): Promise<ScrapedOrigin> => {
        const {
          og,
          metadata,
          origin: scrapedOrigin,
        } = await scrapeOriginData(origin);
        return {
          origin,
          title: metadata?.title ?? og?.ogTitle,
          description: metadata?.description ?? og?.ogDescription,
          favicon: og?.favicon
            ? og.favicon.startsWith('/')
              ? scrapedOrigin.replace(/\/$/, '') + og.favicon
              : og.favicon
            : undefined,
          ogImages:
            og?.ogImage?.map(image => ({
              url: image.url,
              height: image.height,
              width: image.width,
              title: og.ogTitle,
              description: og.ogDescription,
            })) ?? [],
        };
      })
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      }
    }
  }

  return results;
}

// ============================================================================
// Database Operations
// ============================================================================

async function batchUpsertOrigins(origins: ScrapedOrigin[]) {
  if (origins.length === 0) return { originsUpserted: 0, ogImagesUpserted: 0 };

  let totalOriginsUpserted = 0;
  let totalOgImagesUpserted = 0;

  for (let i = 0; i < origins.length; i += DB_BATCH_SIZE) {
    const batch = origins.slice(i, i + DB_BATCH_SIZE);

    const originValues = batch.map(
      o =>
        Prisma.sql`(gen_random_uuid(), ${o.origin}, ${o.title ?? null}, ${o.description ?? null}, ${o.favicon ?? null}, NOW(), NOW())`
    );

    const upsertedOrigins = await scanDb.$executeRaw`
      INSERT INTO "public"."ResourceOrigin" (id, origin, title, description, favicon, "createdAt", "updatedAt")
      VALUES ${Prisma.join(originValues)}
      ON CONFLICT (origin) DO UPDATE SET
        title = COALESCE(EXCLUDED.title, "ResourceOrigin".title),
        description = COALESCE(EXCLUDED.description, "ResourceOrigin".description),
        favicon = COALESCE(EXCLUDED.favicon, "ResourceOrigin".favicon),
        "updatedAt" = NOW()
    `;
    totalOriginsUpserted += upsertedOrigins;

    const ogImagesWithOrigins = batch.flatMap(o =>
      o.ogImages.map(img => ({ ...img, originUrl: o.origin }))
    );

    if (ogImagesWithOrigins.length > 0) {
      const ogImageValues = ogImagesWithOrigins.map(
        img =>
          Prisma.sql`(gen_random_uuid(), ${img.originUrl}, ${img.url}, ${img.height ?? null}, ${img.width ?? null}, ${img.title ?? null}, ${img.description ?? null})`
      );

      const upsertedImages = await scanDb.$executeRaw`
        INSERT INTO "public"."OgImage" (id, "originId", url, height, width, title, description)
        SELECT v.id, ro.id as "originId", v.url, v.height, v.width, v.title, v.description
        FROM (VALUES ${Prisma.join(ogImageValues)}) AS v(id, origin_url, url, height, width, title, description)
        JOIN "public"."ResourceOrigin" ro ON ro.origin = v.origin_url
        ON CONFLICT (url) DO UPDATE SET
          height = COALESCE(EXCLUDED.height, "OgImage".height),
          width = COALESCE(EXCLUDED.width, "OgImage".width),
          title = COALESCE(EXCLUDED.title, "OgImage".title),
          description = COALESCE(EXCLUDED.description, "OgImage".description)
      `;
      totalOgImagesUpserted += upsertedImages;
    }
  }

  return {
    originsUpserted: totalOriginsUpserted,
    ogImagesUpserted: totalOgImagesUpserted,
  };
}

function validateResources(resources: FacilitatorResource[]): {
  validated: ValidatedResource[];
  skipped: number;
  skipReasons: Record<string, number>;
} {
  const validated: ValidatedResource[] = [];
  let skipped = 0;
  const skipReasons: Record<string, number> = {};

  const addSkipReason = (reason: string) => {
    skipped++;
    skipReasons[reason] = (skipReasons[reason] ?? 0) + 1;
  };

  for (const resource of resources) {
    const parsed = upsertResourceSchema.safeParse({
      ...resource,
      accepts: resource.accepts.map(accept => ({
        ...accept,
        network: accept.network.replace('-', '_') as AcceptsNetwork,
      })),
    });

    if (!parsed.success) {
      const errorPath = parsed.error.issues[0]?.path.join('.') ?? 'unknown';
      addSkipReason(`validation_failed:${errorPath}`);
      continue;
    }

    const supportedAccepts = parsed.data.accepts.filter(accept =>
      SUPPORTED_CHAINS.includes(accept.network as SupportedChain)
    );

    if (supportedAccepts.length === 0) {
      const networks = parsed.data.accepts.map(a => a.network).join(',');
      addSkipReason(`unsupported_network:${networks}`);
      continue;
    }

    try {
      const originUrl = getOriginFromUrl(parsed.data.resource);
      validated.push({
        parsed: { ...parsed.data, accepts: supportedAccepts },
        originUrl,
      });
    } catch {
      addSkipReason('invalid_url');
    }
  }

  return { validated, skipped, skipReasons };
}

async function batchUpsertResources(resources: FacilitatorResource[]) {
  if (resources.length === 0) {
    return {
      resourcesUpserted: 0,
      acceptsUpserted: 0,
      skipped: 0,
      skipReasons: {},
    };
  }

  const { validated, skipped, skipReasons } = validateResources(resources);
  let totalResourcesUpserted = 0;
  let totalAcceptsUpserted = 0;

  for (let i = 0; i < validated.length; i += DB_BATCH_SIZE) {
    const batch = validated.slice(i, i + DB_BATCH_SIZE);

    const resourceValues = batch.map(
      r =>
        Prisma.sql`(gen_random_uuid(), ${r.parsed.resource}, ${r.parsed.type}::"public"."ResourceType", ${r.parsed.x402Version}, ${r.parsed.lastUpdated}, ${r.parsed.metadata ? JSON.stringify(r.parsed.metadata) : null}::jsonb, ${r.originUrl})`
    );

    const upsertedResources = await scanDb.$executeRaw`
      INSERT INTO "public"."Resources" (id, resource, type, "x402Version", "lastUpdated", metadata, "originId")
      SELECT v.id, v.resource, v.type, v.x402_version, v.last_updated, v.metadata, ro.id as "originId"
      FROM (VALUES ${Prisma.join(resourceValues)}) AS v(id, resource, type, x402_version, last_updated, metadata, origin_url)
      JOIN "public"."ResourceOrigin" ro ON ro.origin = v.origin_url
      ON CONFLICT (resource) DO UPDATE SET
        type = EXCLUDED.type,
        "x402Version" = EXCLUDED."x402Version",
        "lastUpdated" = EXCLUDED."lastUpdated",
        metadata = COALESCE(EXCLUDED.metadata, "Resources".metadata)
    `;
    totalResourcesUpserted += upsertedResources;

    const acceptsWithResources = batch.flatMap(r =>
      r.parsed.accepts.map(accept => ({
        ...accept,
        resourceUrl: r.parsed.resource,
      }))
    );

    if (acceptsWithResources.length > 0) {
      const acceptValues = acceptsWithResources.map(
        a =>
          Prisma.sql`(gen_random_uuid(), ${a.resourceUrl}, ${a.scheme}::"public"."AcceptsScheme", ${a.description}, ${a.network}::"public"."AcceptsNetwork", ${BigInt(a.maxAmountRequired)}, ${a.resourceUrl}, ${a.mimeType}, ${a.payTo}, ${a.maxTimeoutSeconds}, ${a.asset}, ${a.outputSchema ? JSON.stringify(a.outputSchema) : null}::jsonb, ${a.extra ? JSON.stringify(a.extra) : null}::jsonb)`
      );

      const upsertedAccepts = await scanDb.$executeRaw`
        INSERT INTO "public"."Accepts" (id, "resourceId", scheme, description, network, "maxAmountRequired", resource, "mimeType", "payTo", "maxTimeoutSeconds", asset, "outputSchema", extra)
        SELECT v.id, r.id as "resourceId", v.scheme, v.description, v.network, v.max_amount_required, v.resource_url, v.mime_type, v.pay_to, v.max_timeout_seconds, v.asset, v.output_schema, v.extra
        FROM (VALUES ${Prisma.join(acceptValues)}) AS v(id, resource_url, scheme, description, network, max_amount_required, resource_url_2, mime_type, pay_to, max_timeout_seconds, asset, output_schema, extra)
        JOIN "public"."Resources" r ON r.resource = v.resource_url
        ON CONFLICT ("resourceId", scheme, network) DO UPDATE SET
          description = EXCLUDED.description,
          "maxAmountRequired" = EXCLUDED."maxAmountRequired",
          "mimeType" = EXCLUDED."mimeType",
          "payTo" = EXCLUDED."payTo",
          "maxTimeoutSeconds" = EXCLUDED."maxTimeoutSeconds",
          asset = EXCLUDED.asset,
          "outputSchema" = COALESCE(EXCLUDED."outputSchema", "Accepts"."outputSchema"),
          extra = COALESCE(EXCLUDED.extra, "Accepts".extra)
      `;
      totalAcceptsUpserted += upsertedAccepts;
    }
  }

  return {
    resourcesUpserted: totalResourcesUpserted,
    acceptsUpserted: totalAcceptsUpserted,
    skipped,
    skipReasons,
  };
}

// ============================================================================
// Route Handler
// ============================================================================

export const maxDuration = 300;

export const GET = async (request: NextRequest) => {
  const cronCheck = checkCronSecret(request);
  if (cronCheck) return cronCheck;

  const startTime = Date.now();
  const skipParam = request.nextUrl.searchParams.get('skip');
  const skip = skipParam ? skipParam.split(',').map(s => s.trim()) : [];

  try {
    // Step 1: Fetch resources from facilitators
    console.log('[sync] Starting resource fetch', {
      skip: skip.length > 0 ? skip : 'none',
    });
    const {
      resources,
      errors: fetchErrors,
      skippedFacilitators,
    } = await fetchAllResources(skip);
    console.log('[sync] Fetched resources', {
      count: resources.length,
      errors: fetchErrors.length,
    });

    if (resources.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No resources to sync',
        skippedFacilitators,
        facilitatorErrors: fetchErrors,
      });
    }

    // Step 2: Extract and scrape unique origins
    const originsSet = new Set<string>();
    for (const resource of resources) {
      try {
        originsSet.add(getOriginFromUrl(resource.resource));
      } catch {
        // Skip invalid URLs
      }
    }
    const uniqueOrigins = Array.from(originsSet);

    console.log('[sync] Scraping origins', { count: uniqueOrigins.length });
    const scrapedOrigins = await scrapeOriginsInBatches(
      uniqueOrigins,
      SCRAPE_CONCURRENCY
    );

    // Step 3: Upsert origins
    const { originsUpserted, ogImagesUpserted } =
      await batchUpsertOrigins(scrapedOrigins);
    console.log('[sync] Upserted origins', {
      originsUpserted,
      ogImagesUpserted,
    });

    // Step 4: Upsert resources
    const { resourcesUpserted, acceptsUpserted, skipped, skipReasons } =
      await batchUpsertResources(resources);
    console.log('[sync] Upserted resources', {
      resourcesUpserted,
      acceptsUpserted,
      skipped,
      skipReasons,
    });

    const totalDuration = Date.now() - startTime;
    console.log('[sync] Completed', { durationMs: totalDuration });

    return NextResponse.json({
      success: true,
      message: 'Sync completed successfully',
      skippedFacilitators,
      facilitatorErrors: fetchErrors,
      originsScraped: scrapedOrigins.length,
      originsScrapesFailed: uniqueOrigins.length - scrapedOrigins.length,
      originsUpserted,
      ogImagesUpserted,
      resourcesUpserted,
      acceptsUpserted,
      resourcesSkipped: skipped,
      resourcesSkipReasons: skipReasons,
      durationMs: totalDuration,
    });
  } catch (error) {
    console.error('[sync] Failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        success: false,
        message: 'Sync failed',
        error: error instanceof Error ? error.message : 'Unknown',
      },
      { status: 500 }
    );
  }
};
