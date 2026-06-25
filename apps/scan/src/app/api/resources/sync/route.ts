import { NextResponse } from 'next/server';

import { scrapeOriginData } from '@/services/scraper';
import {
  getOriginResourceCount,
  upsertOrigin,
} from '@/services/db/resources/origin';
import { upsertResource } from '@/services/db/resources/resource';

import { checkCronSecret } from '@/lib/cron';
import { notifyNewServer } from '@/lib/discord-notifications';
import { getOriginFromUrl } from '@/lib/url';
import { isVercelPreviewDeployment } from '@/lib/discovery/vercel-preview';
import { normalizeChainId } from '@/lib/x402';

import type { AcceptsNetwork } from '@x402scan/scan-db/types';
import type z from 'zod';
import type { upsertResourceSchema } from '@/services/db/resources/resource';
import type { NextRequest } from 'next/server';
import {
  discoverableFacilitators,
  listAllFacilitatorResources,
} from 'facilitators';

export const GET = async (request: NextRequest) => {
  const cronCheck = checkCronSecret(request);
  if (cronCheck) {
    return cronCheck;
  }

  // Facilitator sync is temporarily paused
  const FACILITATOR_SYNC_PAUSED = true;
  if (FACILITATOR_SYNC_PAUSED) {
    console.log('Facilitator sync route is paused — returning early');
    return NextResponse.json(
      {
        success: true as const,
        message: 'Facilitator sync is temporarily paused',
        resourcesProcessed: 0,
        originsProcessed: 0,
      },
      { status: 200 }
    );
  }

  try {
    // Step 1: Fetch facilitator resources
    console.log('Fetching facilitator resources');
    const resources = (
      await Promise.all(
        discoverableFacilitators.map(facilitator =>
          listAllFacilitatorResources(facilitator).catch(error => {
            console.error('Failed to fetch facilitator resources', {
              facilitator: facilitator.url,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            return [];
          })
        )
      )
    ).flat();
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

    // Step 1.5: Snapshot current resource counts per origin so we can detect
    // new origins after upserts (origins that go from 0 → >0 active resources).
    const preexistingOrigins = new Set<string>();
    const allOrigins = new Set<string>();
    for (const resource of resources) {
      try {
        allOrigins.add(getOriginFromUrl(resource.resource));
      } catch {
        // Origin extraction failed, skip
      }
    }
    await Promise.all(
      Array.from(allOrigins).map(async origin => {
        const count = await getOriginResourceCount(origin);
        if (count > 0) preexistingOrigins.add(origin);
      })
    );

    // Reject Vercel preview deployments (serve `x-robots-tag: noindex` and get
    // torn down). Checked once per origin so a preview origin's resources are
    // never upserted, even via facilitator sync.
    const previewOrigins = new Set<string>();
    await Promise.all(
      Array.from(allOrigins).map(async origin => {
        if (await isVercelPreviewDeployment(origin)) previewOrigins.add(origin);
      })
    );

    // Step 2: Process resources (upsert to database)
    console.log('Starting resource processing');
    const resourceProcessingStart = Date.now();

    const resourceResults = await Promise.allSettled(
      resources.map(async facilitatorResource => {
        try {
          let resourceOrigin: string | undefined;
          try {
            resourceOrigin = getOriginFromUrl(facilitatorResource.resource);
          } catch {
            resourceOrigin = undefined;
          }
          if (resourceOrigin && previewOrigins.has(resourceOrigin)) {
            console.warn('Skipping Vercel preview deployment', {
              resource: facilitatorResource.resource,
            });
            return {
              resource: facilitatorResource.resource,
              success: false,
              error: 'Vercel preview deployment',
            };
          }

          const result = await upsertResource({
            ...facilitatorResource,
            accepts: facilitatorResource.accepts.map(accept => ({
              ...accept,
              network: normalizeChainId(accept.network) as AcceptsNetwork,
            })) as z.input<typeof upsertResourceSchema>['accepts'],
          });
          if (!result) {
            console.warn('Resource schema validation failed', {
              resource: facilitatorResource.resource,
            });
            return {
              resource: facilitatorResource.resource,
              success: false,
              error: 'Schema validation failed',
            };
          }
          return { resource: facilitatorResource.resource, success: true };
        } catch (error) {
          return {
            resource: facilitatorResource.resource,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    // Analyze resource processing results
    const successfulResources = resourceResults.filter(
      (
        result
      ): result is PromiseFulfilledResult<{
        resource: string;
        success: true;
      }> => result.status === 'fulfilled' && result.value.success
    ).length;
    const failedResources = resourceResults.length - successfulResources;

    console.log('Completed resource processing', {
      totalResources: resources.length,
      successful: successfulResources,
      failed: failedResources,
      durationMs: Date.now() - resourceProcessingStart,
    });

    // Step 3: Extract origins that had at least one successful resource
    const originsWithResources = new Set<string>();
    for (const result of resourceResults) {
      if (result.status === 'fulfilled' && result.value.success) {
        try {
          const origin = getOriginFromUrl(result.value.resource);
          originsWithResources.add(origin);
        } catch {
          // Origin extraction failed, skip
        }
      }
    }

    const uniqueOrigins = Array.from(originsWithResources);

    // Step 4: Process origins with successful resources (scrape metadata and OG data)
    console.log('Starting origin processing with metadata scraping');
    const originProcessingStart = Date.now();

    const originResults = await Promise.allSettled(
      uniqueOrigins.map(async origin => {
        const originStart = Date.now();

        try {
          // Scrape OG, metadata, and high-quality favicon in parallel
          const { og, metadata, favicon } = await scrapeOriginData(origin);

          // Prepare origin data
          const originData = {
            origin,
            title: metadata?.title ?? og?.ogTitle,
            description: metadata?.description ?? og?.ogDescription,
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
          };

          // Upsert origin to database
          const upsertedOrigin = await upsertOrigin(originData);

          if (!preexistingOrigins.has(origin) && upsertedOrigin) {
            notifyNewServer(
              {
                originId: upsertedOrigin.id,
                origin,
                title: originData.title ?? null,
                description: originData.description ?? null,
              },
              { merchantResearch: false }
            );
          }

          return { origin, success: true };
        } catch (error) {
          console.error('Failed to process origin', {
            origin,
            durationMs: Date.now() - originStart,
          });
          return { origin, success: false, error };
        }
      })
    );

    // Analyze origin processing results
    const successfulOrigins = originResults.filter(
      (
        result
      ): result is PromiseFulfilledResult<{
        origin: string;
        success: true;
      }> => result.status === 'fulfilled' && result.value.success
    ).length;
    const failedOrigins = originResults.length - successfulOrigins;

    console.log('Completed origin processing', {
      totalOrigins: uniqueOrigins.length,
      successful: successfulOrigins,
      failed: failedOrigins,
      durationMs: Date.now() - originProcessingStart,
    });

    // Final summary
    const totalDuration = Date.now() - resourceProcessingStart;
    const result = {
      success: true as const,
      message: `Sync completed successfully`,
      resourcesProcessed: successfulResources,
      resourcesFailed: failedResources,
      originsProcessed: successfulOrigins,
      originsFailed: failedOrigins,
      durationMs: totalDuration,
    };
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
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
