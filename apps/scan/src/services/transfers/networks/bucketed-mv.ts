import z from 'zod';
import { Prisma } from '@prisma/client';

import { baseQuerySchema } from '../schemas';
import { createCachedArrayQuery, createStandardCacheKey } from '@/lib/cache';
import { queryRaw } from '@/services/transfers/client';
import { Chain } from '@/types/chain';
import { ActivityTimeframe } from '@/types/timeframes';
import { getMaterializedViewSuffix } from '@/lib/time-range';

export const bucketedNetworksStatisticsMvInputSchema = baseQuerySchema.extend({
  timeframe: z.nativeEnum(ActivityTimeframe).optional().default(ActivityTimeframe.OneDay),
  numBuckets: z.number().optional().default(48),
});

const bucketedNetworkResultSchema = z.array(
  z.object({
    bucket_start: z.date(),
    networks: z.record(
      z.string(),
      z.object({
        total_transactions: z.number(),
        total_amount: z.number(),
        unique_buyers: z.number(),
        unique_sellers: z.number(),
        unique_facilitators: z.number(),
      })
    ),
  })
);

const getBucketedNetworksStatisticsMVUncached = async (
  input: z.infer<typeof bucketedNetworksStatisticsMvInputSchema>
) => {
  const { chain, timeframe } = input;

  const mvTimeframe = getMaterializedViewSuffix(timeframe);
  const tableName = `stats_buckets_${mvTimeframe}`;

  // If a specific chain is requested, only include that one, otherwise all chains
  const chains = chain ? [chain] : Object.values(Chain);

  // Build WHERE clause for materialized view
  const conditions: Prisma.Sql[] = [Prisma.sql`WHERE 1=1`];

  if (chain) {
    conditions.push(Prisma.sql`AND chain = ${chain}`);
  }

  const whereClause = Prisma.join(conditions, ' ');

  const sql = Prisma.sql`
    WITH bucket_stats AS (
      SELECT 
        bucket AS bucket_start,
        chain,
        SUM(total_transactions)::int AS total_transactions,
        SUM(total_amount)::float AS total_amount,
        SUM(unique_buyers)::int AS unique_buyers,
        SUM(unique_sellers)::int AS unique_sellers,
        COUNT(DISTINCT facilitator_id)::int AS unique_facilitators
      FROM ${Prisma.raw(tableName)}
      ${whereClause}
      GROUP BY bucket, chain
    ),
    active_chains AS (
      SELECT DISTINCT chain FROM bucket_stats
    ),
    all_buckets AS (
      SELECT DISTINCT bucket_start FROM bucket_stats
    ),
    network_list AS (
      SELECT unnest(${chains}::text[]) AS chain
    ),
    all_combinations AS (
      SELECT ab.bucket_start, nl.chain
      FROM all_buckets ab
      CROSS JOIN network_list nl
    ),
    combined_stats AS (
      SELECT 
        ac.bucket_start,
        ac.chain,
        COALESCE(bs.total_transactions, 0)::int AS total_transactions,
        COALESCE(bs.total_amount, 0)::float AS total_amount,
        COALESCE(bs.unique_buyers, 0)::int AS unique_buyers,
        COALESCE(bs.unique_sellers, 0)::int AS unique_sellers,
        COALESCE(bs.unique_facilitators, 0)::int AS unique_facilitators
      FROM all_combinations ac
      LEFT JOIN bucket_stats bs 
        ON ac.bucket_start = bs.bucket_start 
        AND ac.chain = bs.chain
    )
    SELECT 
      bucket_start,
      jsonb_object_agg(
        chain,
        jsonb_build_object(
          'total_transactions', total_transactions,
          'total_amount', total_amount,
          'unique_buyers', unique_buyers,
          'unique_sellers', unique_sellers,
          'unique_facilitators', unique_facilitators
        )
      ) AS networks
    FROM combined_stats
    GROUP BY bucket_start
    ORDER BY bucket_start
  `;

  const rawResult = await queryRaw(sql, bucketedNetworkResultSchema);

  return rawResult;
};

export const getBucketedNetworksStatisticsMV = createCachedArrayQuery({
  queryFn: getBucketedNetworksStatisticsMVUncached,
  cacheKeyPrefix: 'bucketed-networks-statistics-mv',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['bucket_start'],
  tags: ['networks-statistics'],
});

