import z from 'zod';

import { baseBucketedQuerySchema } from '../../schemas';
import { createCachedArrayQuery, createStandardCacheKey } from '@/lib/cache';
import { queryRaw } from '@/services/transfers/client';
import { transfersWhereClause } from '../../query-utils';
import { getBucketedTimeRangeFromTimeframe } from '@/lib/time-range';
import { getFirstTransferTimestamp } from '../../stats/first-transfer';
import { firstTransfer } from '@/services/facilitator/constants';

export const bucketedSellerStatisticsInputSchema = baseBucketedQuerySchema;

const bucketedSellerResultSchema = z.array(
  z.object({
    bucket_start: z.coerce.date(),
    total_sellers: z.coerce.number(),
    new_sellers: z.coerce.number(),
  })
);

const getBucketedSellerStatisticsUncached = async (
  input: z.infer<typeof bucketedSellerStatisticsInputSchema>
) => {
  const { timeframe, numBuckets } = input;

  const { startDate, endDate } = await getBucketedTimeRangeFromTimeframe({
    period: timeframe,
    creationDate: async () =>
      (await getFirstTransferTimestamp(input)) ?? firstTransfer,
  });

  const timeRangeMs = endDate.getTime() - startDate.getTime();
  const bucketSizeSeconds = Math.max(
    1,
    Math.floor(timeRangeMs / numBuckets / 1000)
  );

  const startTimestamp =
    Math.floor(startDate.getTime() / 1000 / bucketSizeSeconds) *
    bucketSizeSeconds;
  const endTimestamp = Math.floor(endDate.getTime() / 1000);
  const whereClause = transfersWhereClause(input);

  const sql = `
    WITH all_buckets AS (
      SELECT toDateTime(arrayJoin(range(${startTimestamp}, ${endTimestamp}, ${bucketSizeSeconds}))) AS bucket_start
    ),
    seller_first_transactions AS (
      SELECT 
        recipient,
        MIN(block_timestamp) AS first_transaction_date
      FROM public_TransferEvent
      GROUP BY recipient
    ),
    bucket_stats AS (
      SELECT 
        toStartOfInterval(block_timestamp, INTERVAL ${bucketSizeSeconds} SECOND) AS bucket_start,
        uniq(recipient) AS total_sellers,
        uniqIf(recipient,
          toStartOfInterval(sft.first_transaction_date, INTERVAL ${bucketSizeSeconds} SECOND) = 
          toStartOfInterval(block_timestamp, INTERVAL ${bucketSizeSeconds} SECOND)
        ) AS new_sellers
      FROM public_TransferEvent
      LEFT JOIN seller_first_transactions sft ON recipient = sft.recipient
      ${whereClause}
      GROUP BY bucket_start
    )
    SELECT 
      ab.bucket_start,
      COALESCE(bs.total_sellers, 0) AS total_sellers,
      COALESCE(bs.new_sellers, 0) AS new_sellers
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
