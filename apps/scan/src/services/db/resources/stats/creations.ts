import z from 'zod';

import { scanDb, Prisma } from '../../../../../../../databases/scan/src';

import { firstTransfer } from '@/services/facilitator/constants';

import { createCachedArrayQuery, createStandardCacheKey } from '@/lib/cache';
import { getBucketedTimeRangeFromTimeframe } from '@/lib/time-range';

import type { resourceBucketedQuerySchema } from './schemas';

const bucketedCreationsResultSchema = z.array(
  z.object({
    bucket_start: z.date(),
    total_resources: z.number(),
  })
);

const getBucketedResourceCreationsUncached = async (
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
        AND r.id IN (
          SELECT rt."resourceId"
          FROM "ResourcesTags" rt
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
          floor(extract(epoch from r."lastUpdated") / ${bucketSizeSeconds}) * ${bucketSizeSeconds}
        ) AS bucket_start,
        COUNT(*)::int AS total_resources
      FROM "Resources" r
      WHERE r."lastUpdated" >= ${startDate}::timestamp
        AND r."lastUpdated" <= ${endDate}::timestamp
        ${tagFilterClause}
      GROUP BY bucket_start
    )
    SELECT
      ab.bucket_start,
      COALESCE(bs.total_resources, 0)::int AS total_resources
    FROM all_buckets ab
    LEFT JOIN bucket_stats bs ON ab.bucket_start = bs.bucket_start
    ORDER BY ab.bucket_start
    LIMIT ${numBuckets}
  `;

  const rawResult =
    await scanDb.$queryRaw<
      Array<{ bucket_start: Date; total_resources: number }>
    >(sql);

  return bucketedCreationsResultSchema.parse(rawResult);
};

export const getBucketedResourceCreations = createCachedArrayQuery({
  queryFn: getBucketedResourceCreationsUncached,
  cacheKeyPrefix: 'bucketed-resource-creations',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['bucket_start'],
  tags: ['resource-statistics', 'resources'],
});
