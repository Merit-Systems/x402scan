import z from 'zod';
import {
  scanDb,
  Prisma,
} from '../../../../../../../packages/internal/databases/scan/src';

import { firstTransfer } from '@/services/facilitator/constants';

import { getBucketedTimeRangeFromTimeframe } from '@/lib/time-range';
import { createCachedArrayQuery, createStandardCacheKey } from '@/lib/cache';

import type { resourceBucketedQuerySchema } from './schemas';

const bucketedToolCallsByTagsResultSchema = z.array(
  z.object({
    bucket_start: z.date(),
    tags: z.record(
      z.string(),
      z.object({
        tag_name: z.string(),
        total_tool_calls: z.number(),
      })
    ),
  })
);

const getBucketedToolCallsByTagsUncached = async (
  input: z.infer<typeof resourceBucketedQuerySchema>
) => {
  const { timeframe, numBuckets } = input;

  const { startDate, endDate } = await getBucketedTimeRangeFromTimeframe({
    period: timeframe,
    creationDate: firstTransfer,
  });

  const timeRangeMs = endDate.getTime() - startDate.getTime();
  const bucketSizeSeconds = Math.max(
    1,
    Math.floor(timeRangeMs / numBuckets / 1000)
  );

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
        t.id AS tag_id,
        t.name AS tag_name,
        COUNT(*)::int AS total_tool_calls
      FROM "ToolCall" tc
      INNER JOIN "Resources" r ON tc."resourceId" = r.id
      INNER JOIN "ResourcesTags" rt ON rt."resourceId" = r.id
      INNER JOIN "Tag" t ON rt."tagId" = t.id
      WHERE tc."createdAt" >= ${startDate}::timestamp
        AND tc."createdAt" <= ${endDate}::timestamp
      GROUP BY bucket_start, t.id, t.name
    )
    SELECT
      ab.bucket_start,
      COALESCE(
        json_object_agg(
          bs.tag_id,
          json_build_object(
            'tag_name', bs.tag_name,
            'total_tool_calls', bs.total_tool_calls
          )
        ) FILTER (WHERE bs.tag_id IS NOT NULL),
        '{}'::json
      ) AS tags
    FROM all_buckets ab
    LEFT JOIN bucket_stats bs ON ab.bucket_start = bs.bucket_start
    GROUP BY ab.bucket_start
    ORDER BY ab.bucket_start
    LIMIT ${numBuckets}
  `;

  const rawResult = await scanDb.$queryRaw<
    Array<{
      bucket_start: Date;
      tags: Record<
        string,
        {
          tag_name: string;
          total_tool_calls: number;
        }
      >;
    }>
  >(sql);

  return bucketedToolCallsByTagsResultSchema.parse(rawResult);
};

export const getBucketedToolCallsByTags = createCachedArrayQuery({
  queryFn: getBucketedToolCallsByTagsUncached,
  cacheKeyPrefix: 'bucketed-tool-calls-by-tags',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['bucket_start'],
  tags: ['resource-statistics', 'resources', 'tool-calls', 'tags'],
});
