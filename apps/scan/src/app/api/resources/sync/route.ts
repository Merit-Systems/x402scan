import { NextResponse } from 'next/server';

import { scanDb } from '@x402scan/scan-db';
import { Prisma } from '@x402scan/scan-db';
import { scrapeOriginData } from '@/services/scraper';
import { upsertResourceSchema } from '@/services/db/resources/resource';

import { checkCronSecret } from '@/lib/cron';
import { getOriginFromUrl } from '@/lib/url';
import { SUPPORTED_CHAINS } from '@/types/chain';

import type { AcceptsNetwork } from '@x402scan/scan-db/types';
import type { SupportedChain } from '@/types/chain';
import type { NextRequest } from 'next/server';
import {
  discoverableFacilitators,
  listAllFacilitatorResources,
} from 'facilitators';

// Concurrency for HTTP scraping (I/O bound, can be higher)
const SCRAPE_CONCURRENCY = 10;

// Batch size for SQL operations
const DB_BATCH_SIZE = 100;

interface ScrapedOriginData {
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

/**
 * Process items in batches with controlled concurrency for I/O operations.
 */
async function scrapeInBatches(
  origins: string[],
  concurrency: number
): Promise<ScrapedOriginData[]> {
  const results: ScrapedOriginData[] = [];

  for (let i = 0; i < origins.length; i += concurrency) {
    const batch = origins.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map(async origin => {
        const {
          og,
          metadata,
          origin: scrapedOrigin,
        } = await scrapeOriginData(origin);

        return {
          origin,
          title: metadata?.title ?? og?.ogTitle,
          description: metadata?.description ?? og?.ogDescription,
          favicon:
            og?.favicon &&
            (og.favicon.startsWith('/')
              ? scrapedOrigin.replace(/\/$/, '') + og.favicon
              : og.favicon),
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
 * Batch upsert origins using raw SQL INSERT ... ON CONFLICT
 * This uses a single DB connection for all origins instead of N connections.
 */
async function batchUpsertOrigins(origins: ScrapedOriginData[]): Promise<{
  originsUpserted: number;
  ogImagesUpserted: number;
}> {
  if (origins.length === 0) return { originsUpserted: 0, ogImagesUpserted: 0 };

  let totalOriginsUpserted = 0;
  let totalOgImagesUpserted = 0;

  // Process in batches to avoid query size limits
  for (let i = 0; i < origins.length; i += DB_BATCH_SIZE) {
    const batch = origins.slice(i, i + DB_BATCH_SIZE);

    // Build batch upsert for origins
    const originValues = batch.map(
      o =>
        Prisma.sql`(gen_random_uuid(), ${o.origin}, ${o.title ?? null}, ${o.description ?? null}, ${o.favicon ?? null}, NOW(), NOW())`
    );

    // Use a single INSERT with ON CONFLICT for all origins in this batch
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

    // Collect all OG images with their origin URLs
    const ogImagesWithOrigins = batch.flatMap(o =>
      o.ogImages.map(img => ({ ...img, originUrl: o.origin }))
    );

    if (ogImagesWithOrigins.length > 0) {
      // Batch upsert OG images (need to join with origins to get IDs)
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

type ParsedResource = ReturnType<typeof upsertResourceSchema.safeParse> & {
  success: true;
};

/**
 * Batch upsert resources and accepts using raw SQL
 * This uses a single DB connection for all resources instead of N connections.
 */
async function batchUpsertResources(
  resources: Awaited<ReturnType<typeof listAllFacilitatorResources>>
): Promise<{
  resourcesUpserted: number;
  acceptsUpserted: number;
  skipped: number;
}> {
  if (resources.length === 0)
    return { resourcesUpserted: 0, acceptsUpserted: 0, skipped: 0 };

  // Parse and validate all resources first
  const parsedResources: {
    parsed: ParsedResource['data'];
    originUrl: string;
  }[] = [];
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

    // Filter to only supported chains
    const supportedAccepts = parsed.data.accepts.filter(accept =>
      SUPPORTED_CHAINS.includes(accept.network as SupportedChain)
    );

    if (supportedAccepts.length === 0) {
      skipped++;
      continue;
    }

    try {
      const originUrl = getOriginFromUrl(parsed.data.resource);
      parsedResources.push({
        parsed: { ...parsed.data, accepts: supportedAccepts },
        originUrl,
      });
    } catch {
      skipped++;
    }
  }

  let totalResourcesUpserted = 0;
  let totalAcceptsUpserted = 0;

  // Process in batches
  for (let i = 0; i < parsedResources.length; i += DB_BATCH_SIZE) {
    const batch = parsedResources.slice(i, i + DB_BATCH_SIZE);

    // Batch upsert resources
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

    // Collect all accepts with their resource URLs
    const acceptsWithResources = batch.flatMap(r =>
      r.parsed.accepts.map(accept => ({
        ...accept,
        resourceUrl: r.parsed.resource,
      }))
    );

    if (acceptsWithResources.length > 0) {
      // Batch upsert accepts
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

export const GET = async (request: NextRequest) => {
  const cronCheck = checkCronSecret(request);
  if (cronCheck) {
    return cronCheck;
  }

  const startTime = Date.now();

  try {
    // Step 1: Fetch facilitator resources (sequentially to avoid rate limits)
    console.log('Fetching facilitator resources');
    const resources: Awaited<ReturnType<typeof listAllFacilitatorResources>> =
      [];

    for (const facilitator of discoverableFacilitators) {
      try {
        const facilitatorResources =
          await listAllFacilitatorResources(facilitator);
        resources.push(...facilitatorResources);
      } catch (error) {
        console.error('Failed to fetch facilitator resources', {
          facilitator: facilitator.url,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log('Successfully fetched facilitator resources', {
      totalResources: resources.length,
    });

    if (resources.length === 0) {
      console.warn('No resources found from facilitator');
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

    // Step 2: Extract unique origins
    console.log('Extracting unique origins from resources');
    const originsSet = new Set<string>();
    for (const resource of resources) {
      try {
        const origin = getOriginFromUrl(resource.resource);
        originsSet.add(origin);
      } catch (error) {
        console.warn('Failed to extract origin from resource', {
          resource: resource.resource,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const uniqueOrigins = Array.from(originsSet);

    // Step 3: Scrape origin metadata (I/O bound - parallelized)
    console.log('Starting origin scraping', {
      totalOrigins: uniqueOrigins.length,
      concurrency: SCRAPE_CONCURRENCY,
    });
    const scrapeStart = Date.now();
    const scrapedOrigins = await scrapeInBatches(
      uniqueOrigins,
      SCRAPE_CONCURRENCY
    );
    console.log('Completed origin scraping', {
      scraped: scrapedOrigins.length,
      failed: uniqueOrigins.length - scrapedOrigins.length,
      durationMs: Date.now() - scrapeStart,
    });

    // Step 4: Batch upsert origins to DB (single connection, batched SQL)
    console.log('Batch upserting origins', {
      count: scrapedOrigins.length,
      batchSize: DB_BATCH_SIZE,
    });
    const originDbStart = Date.now();
    const { originsUpserted, ogImagesUpserted } =
      await batchUpsertOrigins(scrapedOrigins);
    console.log('Completed origin upsert', {
      originsUpserted,
      ogImagesUpserted,
      durationMs: Date.now() - originDbStart,
    });

    // Step 5: Batch upsert resources to DB (single connection, batched SQL)
    console.log('Batch upserting resources', {
      count: resources.length,
      batchSize: DB_BATCH_SIZE,
    });
    const resourceDbStart = Date.now();
    const { resourcesUpserted, acceptsUpserted, skipped } =
      await batchUpsertResources(resources);
    console.log('Completed resource upsert', {
      resourcesUpserted,
      acceptsUpserted,
      skipped,
      durationMs: Date.now() - resourceDbStart,
    });

    // Final summary
    const totalDuration = Date.now() - startTime;
    const result = {
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
    };
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Sync failed', {
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
