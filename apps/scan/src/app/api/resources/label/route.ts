import { NextResponse, type NextRequest } from 'next/server';
import { checkCronSecret } from '@/lib/cron';
import { listResourcesWithPagination } from '@/services/db/resources/resource';
import { labelingPass } from '@/services/labeling/label';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/services/db/client';
import { z } from 'zod';
import { v4 } from 'uuid';

const resourceLabelingPayloadSchema = z.object({
  resourceIds: z.array(z.string()).optional(),
});

async function* iterateResourcesBatched(
  batchSize: number,
  where?: Prisma.ResourcesWhereInput
) {
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const { items, hasNextPage } = await listResourcesWithPagination(
      { page, page_size: batchSize },
      where
    );

    console.info('Fetched batch', {
      page,
      itemsCount: items.length,
      hasNextPage,
    });

    if (items.length === 0) {
      break;
    }

    yield items;

    hasMore = hasNextPage;
    page++;
  }
}

export const GET = async (request: NextRequest) => {
  const cronCheck = checkCronSecret(request);
  if (cronCheck) {
    return cronCheck;
  }

  const sessionId = v4();

  const labelingStart = Date.now();

  const searchParams = request.nextUrl.searchParams;
  const resourceIdsParam = searchParams.get('resourceIds');
  const resourceIds = resourceIdsParam
    ? resourceIdsParam.split(',')
    : undefined;

  const payload = resourceLabelingPayloadSchema.parse({ resourceIds });

  const where: Prisma.ResourcesWhereInput | undefined = payload.resourceIds
    ? {
        id: {
          in: payload.resourceIds,
        },
      }
    : {
        tags: {
          none: {},
        },
      };

  const results = [];
  let totalProcessed = 0;
  let totalSuccess = 0;
  let totalFailed = 0;

  // Fetch all resource IDs upfront to avoid dynamic filter issues
  const resourcesToProcess = await prisma.resources.findMany({
    where,
    select: { id: true },
  });

  console.info('Starting resource labeling task', {
    resourceIds: payload.resourceIds,
    mode: payload.resourceIds ? 'specific_resources' : 'unlabeled_resources',
    hasFilter: !!where,
    totalResources: resourcesToProcess.length,
  });

  const resourceIdsToProcess = resourcesToProcess.map(r => r.id);
  const whereWithIds: Prisma.ResourcesWhereInput = {
    id: { in: resourceIdsToProcess },
  };

  for await (const batch of iterateResourcesBatched(100, whereWithIds)) {
    console.info(`Processing batch of ${batch.length} resources`);

    const batchResults = await Promise.allSettled(
      batch.map(async resource => {
        try {
          const result = await labelingPass(resource, { sessionId });
          return {
            resourceId: resource.id,
            tagId: result.tag.id,
            tagName: result.tag.name,
            success: true,
          };
        } catch (error) {
          return {
            resourceId: resource.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    for (const result of batchResults) {
      totalProcessed++;
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          totalSuccess++;
        } else {
          totalFailed++;
        }
        results.push(result.value);
      } else {
        totalFailed++;
        results.push({
          success: false,
          error:
            result.reason instanceof Error
              ? result.reason.message
              : 'Unknown error',
        });
      }
    }
  }

  const durationMs = Date.now() - labelingStart;

  console.info('Resource labeling task completed', {
    totalProcessed,
    totalSuccess,
    totalFailed,
    durationMs,
  });

  return NextResponse.json(
    {
      success: true as const,
      message: 'Resource labeling completed',
      processed: totalProcessed,
      successful: totalSuccess,
      failed: totalFailed,
      durationMs,
      results: results.slice(0, 100), // Limit response size
    },
    { status: 200 }
  );
};
