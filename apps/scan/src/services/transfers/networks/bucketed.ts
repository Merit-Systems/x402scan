import z from 'zod';

import { baseBucketedQuerySchema } from '../schemas';
import { createCachedArrayQuery, createStandardCacheKey } from '@/lib/cache';
import { queryRaw } from '@/services/transfers/client';
import { Chain } from '@/types/chain';
import { getBucketedTimeRangeFromTimeframe } from '@/lib/time-range';
import { getFirstTransferTimestamp } from '../stats/first-transfer';
import { firstTransfer } from '@/services/facilitator/constants';

export const bucketedNetworksStatisticsInputSchema = baseBucketedQuerySchema;

const bucketedNetworkResultSchema = z.array(
  z.object({
    bucket_start: z.coerce.date(),
    networks: z.record(
      z.string(),
      z.object({
        total_transactions: z.coerce.number(),
        total_amount: z.number(),
        unique_buyers: z.coerce.number(),
        unique_sellers: z.coerce.number(),
        unique_facilitators: z.number(),
      })
    ),
  })
);

const getBucketedNetworksStatisticsUncached = async (
  input: z.infer<typeof bucketedNetworksStatisticsInputSchema>
) => {
  const { timeframe, numBuckets, chain } = input;

  const { startDate, endDate } = await getBucketedTimeRangeFromTimeframe({
    period: timeframe,
    creationDate: async () =>
      (await getFirstTransferTimestamp(input)) ?? firstTransfer,
  });

  // If a specific chain is requested, only include that one, otherwise all chains
  const chains = chain ? [chain] : Object.values(Chain);

  const timeRangeMs = endDate.getTime() - startDate.getTime();
  const bucketSizeSeconds = Math.max(
    1,
    Math.floor(timeRangeMs / numBuckets / 1000)
  );

  const startTimestamp =
    Math.floor(startDate.getTime() / 1000 / bucketSizeSeconds) *
    bucketSizeSeconds;
  const endTimestamp = Math.floor(endDate.getTime() / 1000);

  const conditions: string[] = ['1=1'];
  if (chain) {
    conditions.push(`chain = '${chain}'`);
  }
  if (startDate) {
    conditions.push(
      `block_timestamp >= parseDateTime64BestEffort('${startDate.toISOString()}')`
    );
  }
  if (endDate) {
    conditions.push(
      `block_timestamp <= parseDateTime64BestEffort('${endDate.toISOString()}')`
    );
  }
  const whereClause = 'WHERE ' + conditions.join(' AND ');

  const chainsArray = chains.map(c => `'${c}'`).join(', ');

  const sql = `
    WITH all_buckets AS (
      SELECT toDateTime(arrayJoin(range(${startTimestamp}, ${endTimestamp}, ${bucketSizeSeconds}))) AS bucket_start
    ),
    network_list AS (
      SELECT arrayJoin([${chainsArray}]) AS chain
    ),
    all_combinations AS (
      SELECT ab.bucket_start, nl.chain
      FROM all_buckets ab
      CROSS JOIN network_list nl
    ),
    bucket_stats AS (
      SELECT
        toStartOfInterval(block_timestamp, INTERVAL ${bucketSizeSeconds} SECOND) AS bucket_start,
        chain,
        COUNT(*) AS total_transactions,
        SUM(amount) AS total_amount,
        uniq(sender) AS unique_buyers,
        uniq(recipient) AS unique_sellers,
        uniq(facilitator_id) AS unique_facilitators
      FROM public_TransferEvent
      ${whereClause}
      GROUP BY bucket_start, chain
    ),
    combined_stats AS (
      SELECT 
        ac.bucket_start,
        ac.chain,
        COALESCE(bs.total_transactions, 0) AS total_transactions,
        COALESCE(bs.total_amount, 0) AS total_amount,
        COALESCE(bs.unique_buyers, 0) AS unique_buyers,
        COALESCE(bs.unique_sellers, 0) AS unique_sellers,
        COALESCE(bs.unique_facilitators, 0) AS unique_facilitators
      FROM all_combinations ac
      LEFT JOIN bucket_stats bs 
        ON ac.bucket_start = bs.bucket_start 
        AND ac.chain = bs.chain
    )
    SELECT 
      bucket_start,
      map(
        groupArray(chain),
        groupArray((total_transactions, total_amount, unique_buyers, unique_sellers, unique_facilitators))
      ) AS networks
    FROM combined_stats
    GROUP BY bucket_start
    ORDER BY bucket_start
    LIMIT ${numBuckets}
  `;

  const rawResult = await queryRaw(
    sql,
    z.array(
      z.object({
        bucket_start: z.coerce.date(),
        networks: z.any(),
      })
    )
  );

  // Transform ClickHouse map to the expected format
  const transformedResult = rawResult.map(row => {
    const networks: Record<
      string,
      {
        total_transactions: number;
        total_amount: number;
        unique_buyers: number;
        unique_sellers: number;
        unique_facilitators: number;
      }
    > = {};

    if (Array.isArray(row.networks)) {
      const keys = Object.keys(row.networks);
      keys.forEach(key => {
        const value = (row.networks as any)[key];
        if (Array.isArray(value) && value.length === 5) {
          networks[key] = {
            total_transactions: value[0],
            total_amount: value[1],
            unique_buyers: value[2],
            unique_sellers: value[3],
            unique_facilitators: value[4],
          };
        }
      });
    }

    return {
      bucket_start: row.bucket_start,
      networks,
    };
  });

  return bucketedNetworkResultSchema.parse(transformedResult);
};

export const getBucketedNetworksStatistics = createCachedArrayQuery({
  queryFn: getBucketedNetworksStatisticsUncached,
  cacheKeyPrefix: 'bucketed-networks-statistics',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['bucket_start'],

  tags: ['networks-statistics'],
});
