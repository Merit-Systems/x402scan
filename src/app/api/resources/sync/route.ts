import { NextResponse } from 'next/server';

import { scrapeOriginData } from '@/services/scraper';
import { facilitators } from '@/services/facilitator/facilitators';
import { listAllFacilitatorResources } from '@/services/facilitator/list-resources';
import { upsertOrigin } from '@/services/db/resources/origin';
import { upsertResource } from '@/services/db/resources/resource';

import { checkCronSecret } from '@/lib/cron';
import { getOriginFromUrl } from '@/lib/url';

import type { AcceptsNetwork } from '@prisma/client';
import type z from 'zod';
import type { upsertResourceSchema } from '@/services/db/resources/resource';
import type { NextRequest } from 'next/server';

export const GET = async (request: NextRequest) => {
  const cronCheck = checkCronSecret(request);
  if (cronCheck) {
    return cronCheck;
  }

  try {
    // Step 1: Fetch facilitator resources
    console.log('Fetching facilitator resources');
    const resources = (
      await Promise.all(
        facilitators.map(facilitator =>
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

    // Step 2: Extract unique origins
    console.log('Extracting unique origins from resources');
    const origins = new Set<string>();
    for (const resource of resources) {
      try {
        const origin = getOriginFromUrl(resource.resource);
        origins.add(origin);
      } catch (error) {
        console.warn('Failed to extract origin from resource', {
          resource: resource.resource,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const uniqueOrigins = Array.from(origins);

    // Step 3: Process origins (scrape metadata and OG data)
    console.log('Starting origin processing with metadata scraping');
    const originProcessingStart = Date.now();

    const originResults = await Promise.allSettled(
      uniqueOrigins.map(async origin => {
        const originStart = Date.now();

        try {
          // Scrape OG and metadata in parallel
          const {
            og,
            metadata,
            origin: scrapedOrigin,
          } = await scrapeOriginData(origin);

          // Prepare origin data
          const originData = {
            origin: origin,
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

          // Upsert origin to database
          await upsertOrigin(originData);

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

    // Step 4: Process resources (upsert to database)
    console.log('Starting resource processing');
    const resourceProcessingStart = Date.now();

    const resourceResults = await Promise.allSettled(
      resources.map(async facilitatorResource => {
        try {
          await upsertResource({
            ...facilitatorResource,
            accepts: facilitatorResource.accepts.map(accept => ({
              ...accept,
              network: accept.network.replace('-', '_') as AcceptsNetwork,
            })) as z.input<typeof upsertResourceSchema>['accepts'],
          });
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
