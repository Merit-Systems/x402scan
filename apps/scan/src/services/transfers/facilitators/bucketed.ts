import z from 'zod';

import { baseBucketedQuerySchema } from '../schemas';

import { transfersWhereClause } from '../query-utils';

import { firstTransfer } from '@/services/facilitator/constants';
import { queryRaw } from '@/services/transfers/client';

import { createCachedArrayQuery, createStandardCacheKey } from '@/lib/cache';
import { facilitators } from '@/lib/facilitators';
import { getBucketedTimeRangeFromTimeframe } from '@/lib/time-range';

export const bucketedStatisticsInputSchema = baseBucketedQuerySchema;

const getBucketedFacilitatorsStatisticsUncached = async (
  input: z.infer<typeof bucketedStatisticsInputSchema>
) => {
  const { timeframe, numBuckets, chain } = input;

  const { startDate, endDate } = await getBucketedTimeRangeFromTimeframe({
    period: timeframe,
    creationDate: firstTransfer,
  });

  const chainFacilitators = chain
    ? facilitators.filter(f => f.addresses[chain] !== undefined)
    : facilitators;

  const timeRangeMs = endDate.getTime() - startDate.getTime();
  const bucketSizeSeconds = Math.max(
    1,
    Math.floor(timeRangeMs / numBuckets / 1000)
  );

  const facilitatorIds = chainFacilitators.map(f => f.id);

  const startTimestamp =
    Math.floor(startDate.getTime() / 1000 / bucketSizeSeconds) *
    bucketSizeSeconds;
  const endTimestamp = Math.floor(endDate.getTime() / 1000);
  const whereClause = transfersWhereClause({ ...input, facilitatorIds });

  const sql = `
    WITH all_buckets AS (
      SELECT toDateTime(arrayJoin(range(${startTimestamp}, ${endTimestamp}, ${bucketSizeSeconds}))) AS bucket_start
    ),
    bucket_stats AS (
      SELECT
        toStartOfInterval(block_timestamp, INTERVAL ${bucketSizeSeconds} SECOND) AS bucket_start,
        facilitator_id,
        COUNT(*) AS total_transactions,
        SUM(amount) AS total_amount,
        uniq(sender) AS unique_buyers,
        uniq(recipient) AS unique_sellers
      FROM public_TransferEvent
      ${whereClause}
      GROUP BY bucket_start, facilitator_id
    ),
    active_facilitators AS (
      SELECT DISTINCT facilitator_id FROM bucket_stats
    ),
    all_combinations AS (
      SELECT ab.bucket_start, af.facilitator_id
      FROM all_buckets ab
      CROSS JOIN active_facilitators af
    ),
    combined_stats AS (
      SELECT
        ac.bucket_start,
        ac.facilitator_id,
        COALESCE(bs.total_transactions, 0) AS total_transactions,
        COALESCE(bs.total_amount, 0) AS total_amount,
        COALESCE(bs.unique_buyers, 0) AS unique_buyers,
        COALESCE(bs.unique_sellers, 0) AS unique_sellers
      FROM all_combinations ac
      LEFT JOIN bucket_stats bs
        ON ac.bucket_start = bs.bucket_start
        AND ac.facilitator_id = bs.facilitator_id
    )
    SELECT
      bucket_start,
      CAST((
        groupArray(facilitator_id),
        groupArray(map(
          'total_transactions', CAST(total_transactions AS Float64),
          'total_amount', CAST(total_amount AS Float64),
          'unique_buyers', CAST(unique_buyers AS Float64),
          'unique_sellers', CAST(unique_sellers AS Float64)
        ))
      ) AS Map(String, Map(String, Float64))) AS facilitators
    FROM combined_stats
    GROUP BY bucket_start
    ORDER BY bucket_start
    LIMIT ${numBuckets}
  `;

  return await queryRaw(
    sql,
    z.array(
      z.object({
        bucket_start: z.coerce.date(),
        facilitators: z.record(
          z.string(),
          z.object({
            total_transactions: z.coerce.number(),
            total_amount: z.number(),
            unique_buyers: z.coerce.number(),
            unique_sellers: z.coerce.number(),
          })
        ),
      })
    )
  );
};

export const getBucketedFacilitatorsStatistics = createCachedArrayQuery({
  queryFn: getBucketedFacilitatorsStatisticsUncached,
  cacheKeyPrefix: 'bucketed-facilitators-statistics',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['bucket_start'],
  tags: ['facilitators-statistics'],
});
