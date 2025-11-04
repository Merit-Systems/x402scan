import { listResources } from '@/services/db/resources/resource';

import { parseX402Response } from '@/lib/x402/schema';
import { checkCronSecret } from '@/lib/cron';
import { NextResponse, type NextRequest } from 'next/server';
import {
  deleteResourceResponse,
  upsertResourceResponse,
} from '@/services/db/resources/response';

export const GET = async (request: NextRequest) => {
  const cronCheck = checkCronSecret(request);
  if (cronCheck) {
    return cronCheck;
  }

  try {
    // Step 1: Fetch all resources from database
    console.info('Fetching all resources from database');
    const resources = await listResources();
    console.info('Successfully fetched resources', {
      totalResources: resources.length,
    });

    if (resources.length === 0) {
      console.warn('No resources found in database');
      return NextResponse.json(
        {
          success: true as const,
          message: 'No resources to ping',
          resourcesPinged: 0,
        },
        { status: 200 }
      );
    }

    type PingResult =
      | {
          status: 'fulfilled';
          value: {
            resource: string;
            resourceId: string;
            isValid402: boolean;
            success: boolean;
          };
        }
      | {
          status: 'rejected';
          reason: unknown;
        };

    // Helper function to process a single resource
    const processResource = async (
      resource: (typeof resources)[0]
    ): Promise<PingResult> => {
      let handled = false;
      for (const method of ['GET', 'POST']) {
        try {
          const response = await fetch(resource.resource, {
            method,
            headers: {
              'Content-Type': 'application/json',
            },
          });

          const status = response.status;

          if (status === 402) {
            try {
              const parsedResponse = parseX402Response(await response.json());
              if (parsedResponse.success) {
                await upsertResourceResponse(resource.id, parsedResponse.data);
                handled = true;
                return {
                  status: 'fulfilled',
                  value: {
                    resource: resource.resource,
                    resourceId: resource.id,
                    isValid402: true,
                    success: true,
                  },
                };
              } else {
                console.info('resource responded with invalid x402 response', {
                  resource: resource.resource,
                  status,
                  errors: parsedResponse.errors,
                });
              }
            } catch (err) {
              console.error('Failed to upsert resource response', {
                resourceId: resource.id,
                error: err,
              });
              // Parsing or upserting failed, try next method
              continue;
            }
          }
        } catch (err) {
          // Fetch failed - capture as a rejection and stop further attempts for this resource
          return {
            status: 'rejected',
            reason: err,
          };
        }
      }

      if (!handled) {
        try {
          await deleteResourceResponse(resource.id);
        } catch (err) {
          console.error('Failed to delete resource response', {
            resourceId: resource.id,
            error: err,
          });
        }
      }

      return {
        status: 'fulfilled',
        value: {
          resource: resource.resource,
          resourceId: resource.id,
          isValid402: false,
          success: false,
        },
      };
    };

    // Process resources in batches of 50
    const BATCH_SIZE = 50;
    const pingResults: PingResult[] = [];

    for (let i = 0; i < resources.length; i += BATCH_SIZE) {
      const batch = resources.slice(i, i + BATCH_SIZE);
      console.info(
        `Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(resources.length / BATCH_SIZE)}`,
        {
          batchSize: batch.length,
          totalProcessed: i,
          totalResources: resources.length,
        }
      );

      const batchResults = await Promise.all(
        batch.map(resource => processResource(resource))
      );
      pingResults.push(...batchResults);
    }

    return NextResponse.json({
      success: true as const,
      message: 'Resource ping task completed',
      validX402Responses: pingResults.filter(
        result => result.status === 'fulfilled' && result.value?.isValid402
      ).length,
      invalidX402Responses: pingResults.filter(
        result => result.status === 'fulfilled' && !result.value?.isValid402
      ).length,
      failedResponses: pingResults.filter(
        result => result.status === 'rejected'
      ).length,
      totalResponses: pingResults.length,
      resourcesPinged: pingResults.filter(
        result => result.status === 'fulfilled' && result.value?.success
      ).length,
      resourcesNotPinged: pingResults.filter(
        result => result.status === 'fulfilled' && !result.value?.success
      ).length,
    });
  } catch (error) {
    const errorResult = {
      success: false as const,
      message: 'Ping task failed with error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    console.error('Resource ping task failed', {
      ...errorResult,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(errorResult);
  }
};
