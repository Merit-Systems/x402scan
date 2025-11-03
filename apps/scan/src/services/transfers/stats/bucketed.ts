import z from 'zod';
import { Prisma } from '@prisma/client';

import { baseBucketedQuerySchema } from '../schemas';
import { createCachedArrayQuery, createStandardCacheKey } from '@/lib/cache';
import { queryRaw } from '@/services/transfers/client';
import { transfersWhereClause } from '../query-utils';

export const bucketedStatisticsInputSchema = baseBucketedQuerySchema;

const bucketedResultSchema = z.array(
  z.object({
    bucket_start: z.date(),
    total_transactions: z.number(),
    total_amount: z.number(),
    unique_buyers: z.number(),
    unique_sellers: z.number(),
  })
);

const getBucketedStatisticsUncached = async (
  input: z.infer<typeof bucketedStatisticsInputSchema>
) => {
  const { startDate, endDate, numBuckets } = input;

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
          floor(extract(epoch from t.block_timestamp) / ${bucketSizeSeconds}) * ${bucketSizeSeconds}
        ) AS bucket_start,
        COUNT(*)::int AS total_transactions,
        SUM(t.amount)::float AS total_amount,
        COUNT(DISTINCT t.sender)::int AS unique_buyers,
        COUNT(DISTINCT t.recipient)::int AS unique_sellers
      FROM "TransferEvent" t
      ${transfersWhereClause(input)}
      GROUP BY bucket_start
    )
    SELECT 
      ab.bucket_start,
      COALESCE(bs.total_transactions, 0)::int AS total_transactions,
      COALESCE(bs.total_amount, 0)::float AS total_amount,
      COALESCE(bs.unique_buyers, 0)::int AS unique_buyers,
      COALESCE(bs.unique_sellers, 0)::int AS unique_sellers
    FROM all_buckets ab
    LEFT JOIN bucket_stats bs ON ab.bucket_start = bs.bucket_start
    ORDER BY ab.bucket_start
    LIMIT ${numBuckets}
  `;

  const rawResult = await queryRaw(sql, bucketedResultSchema);

  const transformedResult = rawResult.map(row => ({
    ...row,
    total_amount:
      typeof row.total_amount === 'number'
        ? row.total_amount
        : Number(row.total_amount),
  }));

  // Now validate with schema
  return bucketedResultSchema.parse(transformedResult);
};

export const getBucketedStatistics = createCachedArrayQuery({
  queryFn: getBucketedStatisticsUncached,
  cacheKeyPrefix: 'bucketed-statistics',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['bucket_start'],

  tags: ['statistics'],
});
