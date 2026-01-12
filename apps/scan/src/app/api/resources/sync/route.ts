import { NextResponse } from 'next/server';

import { Prisma, scanDb } from '@x402scan/scan-db';
import {
  discoverableFacilitators,
  listAllFacilitatorResources,
} from 'facilitators';

import { checkCronSecret } from '@/lib/cron';
import { getOriginFromUrl } from '@/lib/url';
import { scrapeOriginData } from '@/services/scraper';
import { upsertResourceSchema } from '@/services/db/resources/resource';
import { SUPPORTED_CHAINS } from '@/types/chain';

import type { z } from 'zod';
import type { AcceptsNetwork } from '@x402scan/scan-db/types';
import type { SupportedChain } from '@/types/chain';
import type { NextRequest } from 'next/server';

// ============================================================================
// Constants
// ============================================================================

/** Max concurrent HTTP scraping operations (I/O bound, can be higher) */
const SCRAPE_CONCURRENCY = 10;

/** Batch size for SQL operations to avoid query size limits */
const DB_BATCH_SIZE = 100;

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

interface OriginUpsertResult {
  originsUpserted: number;
  ogImagesUpserted: number;
}

interface ResourceUpsertResult {
  resourcesUpserted: number;
  acceptsUpserted: number;
  skipped: number;
}

interface ValidatedResource {
  parsed: z.output<typeof upsertResourceSchema>;
  originUrl: string;
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * Scrapes origin metadata with controlled concurrency.
 * Processes origins in batches to avoid overwhelming external servers.
 */
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

/**
 * Batch upsert origins using raw SQL INSERT ... ON CONFLICT.
 * Uses a single DB round-trip per batch instead of N individual upserts.
 */
async function batchUpsertOrigins(
  origins: ScrapedOrigin[]
): Promise<OriginUpsertResult> {
  if (origins.length === 0) {
    return { originsUpserted: 0, ogImagesUpserted: 0 };
  }

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

    // Collect OG images with their origin URLs for the join
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
        SELECT 
          v.id,
          ro.id as "originId",
          v.url,
          v.height,
          v.width,
          v.title,
          v.description
        FROM (
          VALUES ${Prisma.join(ogImageValues)}
        ) AS v(id, origin_url, url, height, width, title, description)
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

/**
 * Validates and parses resources, filtering to supported chains.
 * Returns validated resources with their origin URLs.
 */
function validateResources(
  resources: Awaited<ReturnType<typeof listAllFacilitatorResources>>
): { validated: ValidatedResource[]; skipped: number } {
  const validated: ValidatedResource[] = [];
  let skipped = 0;

  for (const resource of resources) {
    const parsed = upsertResourceSchema.safeParse({
      ...resource,
      accepts: resource.accepts.map(accept => ({
        ...accept,
        network: accept.network.replace('-', '_') as AcceptsNetwork,
      })),
    });

    if (!parsed.success) {
      skipped++;
      continue;
    }

    const supportedAccepts = parsed.data.accepts.filter(accept =>
      SUPPORTED_CHAINS.includes(accept.network as SupportedChain)
    );

    if (supportedAccepts.length === 0) {
      skipped++;
      continue;
    }

    try {
      const originUrl = getOriginFromUrl(parsed.data.resource);
      validated.push({
        parsed: { ...parsed.data, accepts: supportedAccepts },
        originUrl,
      });
    } catch {
      skipped++;
    }
  }

  return { validated, skipped };
}

/**
 * Batch upsert resources and accepts using raw SQL.
 * Uses a single DB round-trip per batch instead of N individual upserts.
 */
async function batchUpsertResources(
  resources: Awaited<ReturnType<typeof listAllFacilitatorResources>>
): Promise<ResourceUpsertResult> {
  if (resources.length === 0) {
    return { resourcesUpserted: 0, acceptsUpserted: 0, skipped: 0 };
  }

  const { validated, skipped } = validateResources(resources);

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
      SELECT 
        v.id,
        v.resource,
        v.type,
        v.x402_version,
        v.last_updated,
        v.metadata,
        ro.id as "originId"
      FROM (
        VALUES ${Prisma.join(resourceValues)}
      ) AS v(id, resource, type, x402_version, last_updated, metadata, origin_url)
      JOIN "public"."ResourceOrigin" ro ON ro.origin = v.origin_url
      ON CONFLICT (resource) DO UPDATE SET
        type = EXCLUDED.type,
        "x402Version" = EXCLUDED."x402Version",
        "lastUpdated" = EXCLUDED."lastUpdated",
        metadata = COALESCE(EXCLUDED.metadata, "Resources".metadata)
    `;
    totalResourcesUpserted += upsertedResources;

    // Collect accepts with their resource URLs for the join
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
        SELECT 
          v.id,
          r.id as "resourceId",
          v.scheme,
          v.description,
          v.network,
          v.max_amount_required,
          v.resource_url,
          v.mime_type,
          v.pay_to,
          v.max_timeout_seconds,
          v.asset,
          v.output_schema,
          v.extra
        FROM (
          VALUES ${Prisma.join(acceptValues)}
        ) AS v(id, resource_url, scheme, description, network, max_amount_required, resource_url_2, mime_type, pay_to, max_timeout_seconds, asset, output_schema, extra)
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
  };
}

// ============================================================================
// Route Handler
// ============================================================================

export const GET = async (request: NextRequest) => {
  const cronCheck = checkCronSecret(request);
  if (cronCheck) {
    return cronCheck;
  }

  const startTime = Date.now();

  try {
    // Step 1: Fetch resources from all discoverable facilitators
    console.log('[sync] Fetching facilitator resources');
    const resources: Awaited<ReturnType<typeof listAllFacilitatorResources>> =
      [];

    for (const facilitator of discoverableFacilitators) {
      try {
        const facilitatorResources =
          await listAllFacilitatorResources(facilitator);
        resources.push(...facilitatorResources);
      } catch (error) {
        console.error('[sync] Failed to fetch facilitator resources', {
          facilitator: facilitator.url,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log('[sync] Fetched facilitator resources', {
      count: resources.length,
    });

    if (resources.length === 0) {
      console.warn('[sync] No resources found');
      return NextResponse.json(
        {
          success: true as const,
          message: 'No resources to sync',
          resourcesProcessed: 0,
          originsProcessed: 0,
        },
        { status: 200 }
      );
    }

    // Step 2: Extract unique origins from resources
    const originsSet = new Set<string>();
    for (const resource of resources) {
      try {
        originsSet.add(getOriginFromUrl(resource.resource));
      } catch (error) {
        console.warn('[sync] Failed to extract origin', {
          resource: resource.resource,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    const uniqueOrigins = Array.from(originsSet);

    // Step 3: Scrape origin metadata (parallelized with concurrency limit)
    console.log('[sync] Scraping origins', {
      count: uniqueOrigins.length,
      concurrency: SCRAPE_CONCURRENCY,
    });
    const scrapeStart = Date.now();
    const scrapedOrigins = await scrapeOriginsInBatches(
      uniqueOrigins,
      SCRAPE_CONCURRENCY
    );
    console.log('[sync] Scraped origins', {
      scraped: scrapedOrigins.length,
      failed: uniqueOrigins.length - scrapedOrigins.length,
      durationMs: Date.now() - scrapeStart,
    });

    // Step 4: Batch upsert origins to database
    console.log('[sync] Upserting origins', {
      count: scrapedOrigins.length,
      batchSize: DB_BATCH_SIZE,
    });
    const originDbStart = Date.now();
    const { originsUpserted, ogImagesUpserted } =
      await batchUpsertOrigins(scrapedOrigins);
    console.log('[sync] Upserted origins', {
      originsUpserted,
      ogImagesUpserted,
      durationMs: Date.now() - originDbStart,
    });

    // Step 5: Batch upsert resources to database
    console.log('[sync] Upserting resources', {
      count: resources.length,
      batchSize: DB_BATCH_SIZE,
    });
    const resourceDbStart = Date.now();
    const { resourcesUpserted, acceptsUpserted, skipped } =
      await batchUpsertResources(resources);
    console.log('[sync] Upserted resources', {
      resourcesUpserted,
      acceptsUpserted,
      skipped,
      durationMs: Date.now() - resourceDbStart,
    });

    const totalDuration = Date.now() - startTime;
    console.log('[sync] Completed', { durationMs: totalDuration });

    return NextResponse.json(
      {
        success: true as const,
        message: 'Sync completed successfully',
        originsScraped: scrapedOrigins.length,
        originsScrapesFailed: uniqueOrigins.length - scrapedOrigins.length,
        originsUpserted,
        ogImagesUpserted,
        resourcesUpserted,
        acceptsUpserted,
        resourcesSkipped: skipped,
        durationMs: totalDuration,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[sync] Failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        success: false as const,
        message: 'Sync task failed with error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
};
