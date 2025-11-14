import z from 'zod';

import { scanDb, Prisma } from '@x402scan/scan-db';

import { firstTransfer } from '@/services/facilitator/constants';

import { getBucketedTimeRangeFromTimeframe } from '@/lib/time-range';
import { createCachedArrayQuery, createStandardCacheKey } from '@/lib/cache';

import type { resourceBucketedQuerySchema } from './schemas';

const bucketedToolCallsResultSchema = z.array(
  z.object({
    bucket_start: z.date(),
    total_tool_calls: z.number(),
  })
);

const getBucketedToolCallsUncached = async (
  input: z.infer<typeof resourceBucketedQuerySchema>
) => {
  const { timeframe, numBuckets, tagIds } = input;

  const { startDate, endDate } = await getBucketedTimeRangeFromTimeframe({
    period: timeframe,
    creationDate: firstTransfer,
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
        AND tc."resourceId" IN (
          SELECT r.id
          FROM "Resources" r
          INNER JOIN "ResourcesTags" rt ON rt."resourceId" = r.id
          WHERE rt."tagId" IN (${Prisma.join(tagIds)})
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
        COUNT(*)::int AS total_tool_calls
      FROM "ToolCall" tc
      WHERE tc."createdAt" >= ${startDate}::timestamp
        AND tc."createdAt" <= ${endDate}::timestamp
        ${tagFilterClause}
      GROUP BY bucket_start
    )
    SELECT
      ab.bucket_start,
      COALESCE(bs.total_tool_calls, 0)::int AS total_tool_calls
    FROM all_buckets ab
    LEFT JOIN bucket_stats bs ON ab.bucket_start = bs.bucket_start
    ORDER BY ab.bucket_start
    LIMIT ${numBuckets}
  `;

  const rawResult =
    await scanDb.$queryRaw<
      Array<{ bucket_start: Date; total_tool_calls: number }>
    >(sql);

  return bucketedToolCallsResultSchema.parse(rawResult);
};

export const getBucketedToolCalls = createCachedArrayQuery({
  queryFn: getBucketedToolCallsUncached,
  cacheKeyPrefix: 'bucketed-tool-calls',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['bucket_start'],
  tags: ['resource-statistics', 'resources', 'tool-calls'],
});
