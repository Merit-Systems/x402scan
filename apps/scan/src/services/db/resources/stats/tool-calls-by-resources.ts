import z from 'zod';

import { Prisma } from '@prisma/client';

import type { resourceBucketedQuerySchema } from './schemas';

import { prisma } from '@/services/db/client';

import { createCachedArrayQuery, createStandardCacheKey } from '@/lib/cache';
import { getBucketedTimeRangeFromTimeframe } from '@/lib/time-range';
import { agentsRelease } from '@/lib/agents';

const bucketedToolCallsByResourcesResultSchema = z.array(
  z.object({
    bucket_start: z.date(),
    resources: z.record(
      z.string(),
      z.object({
        resource_name: z.string(),
        total_tool_calls: z.number(),
      })
    ),
  })
);

const getBucketedToolCallsByResourcesUncached = async (
  input: z.infer<typeof resourceBucketedQuerySchema>
) => {
  const { timeframe, numBuckets, tagIds } = input;

  const { startDate, endDate } = await getBucketedTimeRangeFromTimeframe({
    period: timeframe,
    creationDate: agentsRelease,
  });

  const timeRangeMs = endDate.getTime() - startDate.getTime();
  const bucketSizeSeconds = Math.max(
    1,
    Math.floor(timeRangeMs / numBuckets / 1000)
  );

  // Build the tag filter clause
  const tagFilterClause =
    tagIds && tagIds.length > 0
      ? Prisma.sql`
        AND r.id IN (
          SELECT "resourceId"
          FROM "ResourcesTags"
          WHERE "tagId" IN (${Prisma.join(tagIds)})
        )
      `
      : Prisma.empty;

  const sql = Prisma.sql`
    WITH all_buckets AS (
      SELECT generate_series(
        to_timestamp(
          floor(extract(epoch from ${startDate}::timestamp) / ${bucketSizeSeconds}) * ${bucketSizeSeconds}
        ),
        ${endDate}::timestamp,
        (${bucketSizeSeconds} || ' seconds')::interval
      ) AS bucket_start
    ),
    bucket_stats AS (
      SELECT
        to_timestamp(
          floor(extract(epoch from tc."createdAt") / ${bucketSizeSeconds}) * ${bucketSizeSeconds}
        ) AS bucket_start,
        r.id AS resource_id,
        r.resource AS resource_name,
        COUNT(*)::int AS total_tool_calls
      FROM "ToolCall" tc
      INNER JOIN "Resources" r ON tc."resourceId" = r.id
      WHERE tc."createdAt" >= ${startDate}::timestamp
        AND tc."createdAt" <= ${endDate}::timestamp
        ${tagFilterClause}
      GROUP BY bucket_start, r.id, r.resource
    )
    SELECT
      ab.bucket_start,
      COALESCE(
        json_object_agg(
          bs.resource_id,
          json_build_object(
            'resource_name', bs.resource_name,
            'total_tool_calls', bs.total_tool_calls
          )
        ) FILTER (WHERE bs.resource_id IS NOT NULL),
        '{}'::json
      ) AS resources
    FROM all_buckets ab
    LEFT JOIN bucket_stats bs ON ab.bucket_start = bs.bucket_start
    GROUP BY ab.bucket_start
    ORDER BY ab.bucket_start
    LIMIT ${numBuckets}
  `;

  const rawResult = await prisma.$queryRaw<
    Array<{
      bucket_start: Date;
      resources: Record<
        string,
        {
          resource_name: string;
          total_tool_calls: number;
        }
      >;
    }>
  >(sql);

  return bucketedToolCallsByResourcesResultSchema.parse(rawResult);
};

export const getBucketedToolCallsByResources = createCachedArrayQuery({
  queryFn: getBucketedToolCallsByResourcesUncached,
  cacheKeyPrefix: 'bucketed-tool-calls-by-resources',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['bucket_start'],
  tags: ['resource-statistics', 'resources', 'tool-calls'],
});
