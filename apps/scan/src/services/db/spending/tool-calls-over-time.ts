import z from 'zod';

import { createCachedArrayQuery, createStandardCacheKey } from '@/lib/cache';
import { scanDb, Prisma } from '../../../../../../databases/scan/src';
import { getBucketedTimeRangeFromTimeframe } from '@/lib/time-range';
import { agentsRelease } from '@/lib/agents';

export const toolCallsOverTimeQuerySchema = z.object({
  resourceId: z.uuid(),
  timeframe: z.number(),
  numBuckets: z.number().int().positive(),
  walletIds: z.array(z.uuid()).optional(),
});

const bucketedToolCallsResultSchema = z.array(
  z.object({
    bucket_start: z.date(),
    total_tool_calls: z.number(),
  })
);

const getToolCallsOverTimeUncached = async (
  input: z.infer<typeof toolCallsOverTimeQuerySchema>
) => {
  const { resourceId, timeframe, numBuckets, walletIds } = input;

  const { startDate, endDate } = await getBucketedTimeRangeFromTimeframe({
    period: timeframe,
    creationDate: agentsRelease,
  });

  const timeRangeMs = endDate.getTime() - startDate.getTime();
  const bucketSizeSeconds = Math.max(
    1,
    Math.floor(timeRangeMs / numBuckets / 1000)
  );

  // Build the wallet filter clause if walletIds are provided
  const walletFilterClause =
    walletIds && walletIds.length > 0
      ? Prisma.sql`
        AND tc."walletId" IN (${Prisma.join(walletIds)})
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
      WHERE tc."resourceId" = ${resourceId}
        AND tc."createdAt" >= ${startDate}::timestamp
        AND tc."createdAt" <= ${endDate}::timestamp
        ${walletFilterClause}
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

export const getToolCallsOverTime = createCachedArrayQuery({
  queryFn: getToolCallsOverTimeUncached,
  cacheKeyPrefix: 'spending:tool-calls-over-time',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['bucket_start'],
  revalidate: 60,
  tags: ['spending', 'tool-calls'],
});
