import z from 'zod';

import { baseBucketedQuerySchema } from '../schemas';
import { transfersWhereClause } from '../query-utils';
import { getFirstTransferTimestamp } from './first-transfer';

import { firstTransfer } from '@/services/facilitator/constants';
import { queryRaw } from '@/services/transfers/client';

import { createCachedArrayQuery, createStandardCacheKey } from '@/lib/cache';
import { getBucketedTimeRangeFromTimeframe } from '@/lib/time-range';

export const bucketedStatisticsInputSchema = baseBucketedQuerySchema;

const bucketedResultSchema = z.array(
  z.object({
    bucket_start: z.coerce.date(),
    total_transactions: z.coerce.number(),
    total_amount: z.number(),
    unique_buyers: z.coerce.number(),
    unique_sellers: z.coerce.number(),
  })
);

const getBucketedStatisticsUncached = async (
  input: z.infer<typeof bucketedStatisticsInputSchema>
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
    bucket_stats AS (
      SELECT 
        toStartOfInterval(block_timestamp, INTERVAL ${bucketSizeSeconds} SECOND) AS bucket_start,
        COUNT(*) AS total_transactions,
        SUM(amount) AS total_amount,
        uniq(sender) AS unique_buyers,
        uniq(recipient) AS unique_sellers
      FROM public_TransferEvent
      ${whereClause}
      GROUP BY bucket_start
    )
    SELECT 
      ab.bucket_start,
      COALESCE(bs.total_transactions, 0) AS total_transactions,
      COALESCE(bs.total_amount, 0) AS total_amount,
      COALESCE(bs.unique_buyers, 0) AS unique_buyers,
      COALESCE(bs.unique_sellers, 0) AS unique_sellers
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
