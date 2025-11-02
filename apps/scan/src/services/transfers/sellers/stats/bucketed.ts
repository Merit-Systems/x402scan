import z from 'zod';
import { Prisma } from '@prisma/client';

import { baseBucketedQuerySchema } from '../../schemas';
import { createCachedArrayQuery, createStandardCacheKey } from '@/lib/cache';
import { queryRaw } from '@/services/transfers/client';
import { transfersWhereClause } from '../../query-utils';

export const bucketedSellerStatisticsInputSchema = baseBucketedQuerySchema;

const bucketedSellerResultSchema = z.array(
  z.object({
    bucket_start: z.date(),
    total_sellers: z.number(),
    new_sellers: z.number(),
  })
);

const getBucketedSellerStatisticsUncached = async (
  input: z.infer<typeof bucketedSellerStatisticsInputSchema>
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
    seller_first_transactions AS (
      SELECT 
        recipient,
        MIN(block_timestamp) AS first_transaction_date
      FROM "TransferEvent"
      GROUP BY recipient
    ),
    bucket_stats AS (
      SELECT 
        to_timestamp(
          floor(extract(epoch from t.block_timestamp) / ${bucketSizeSeconds}) * ${bucketSizeSeconds}
        ) AS bucket_start,
        COUNT(DISTINCT t.recipient)::int AS total_sellers,
        COUNT(DISTINCT CASE 
          WHEN to_timestamp(
            floor(extract(epoch from sft.first_transaction_date) / ${bucketSizeSeconds}) * ${bucketSizeSeconds}
          ) = to_timestamp(
            floor(extract(epoch from t.block_timestamp) / ${bucketSizeSeconds}) * ${bucketSizeSeconds}
          )
          THEN t.recipient 
        END)::int AS new_sellers
      FROM "TransferEvent" t
      LEFT JOIN seller_first_transactions sft ON t.recipient = sft.recipient
      ${transfersWhereClause(input)}
      GROUP BY bucket_start
    )
    SELECT 
      ab.bucket_start,
      COALESCE(bs.total_sellers, 0)::int AS total_sellers,
      COALESCE(bs.new_sellers, 0)::int AS new_sellers
    FROM all_buckets ab
    LEFT JOIN bucket_stats bs ON ab.bucket_start = bs.bucket_start
    ORDER BY ab.bucket_start
    LIMIT ${numBuckets}
  `;

  const result = await queryRaw(sql, bucketedSellerResultSchema);

  return bucketedSellerResultSchema.parse(result);
};

export const getBucketedSellerStatistics = createCachedArrayQuery({
  queryFn: getBucketedSellerStatisticsUncached,
  cacheKeyPrefix: 'bucketed-seller-statistics',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['bucket_start'],
  tags: ['statistics', 'sellers'],
});
