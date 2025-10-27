import z from 'zod';
import { subMonths } from 'date-fns';
import { Prisma } from '@prisma/client';

import { baseQuerySchema } from '../schemas';
import { createCachedArrayQuery, createStandardCacheKey } from '@/lib/cache';
import { queryRaw } from '@/services/transfers/client';
import { Chain } from '@/types/chain';

export const bucketedNetworksStatisticsInputSchema = baseQuerySchema.extend({
  startDate: z
    .date()
    .optional()
    .default(() => subMonths(new Date(), 1)),
  endDate: z
    .date()
    .optional()
    .default(() => new Date()),
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

const getBucketedNetworksStatisticsUncached = async (
  input: z.infer<typeof bucketedNetworksStatisticsInputSchema>
) => {
  const { startDate, endDate, numBuckets, chain } = input;

  // If a specific chain is requested, only include that one, otherwise all chains
  const chains = chain ? [chain] : Object.values(Chain);

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
    network_list AS (
      SELECT unnest(${chains}::text[]) AS chain
    ),
    all_combinations AS (
      SELECT ab.bucket_start, nl.chain
      FROM all_buckets ab
      CROSS JOIN network_list nl
    ),
    bucket_stats AS (
      SELECT 
        to_timestamp(
          floor(extract(epoch from t.block_timestamp) / ${bucketSizeSeconds}) * ${bucketSizeSeconds}
        ) AS bucket_start,
        t.chain,
        COUNT(*)::int AS total_transactions,
        SUM(t.amount)::float AS total_amount,
        COUNT(DISTINCT t.sender)::int AS unique_buyers,
        COUNT(DISTINCT t.recipient)::int AS unique_sellers,
        COUNT(DISTINCT t.facilitator_id)::int AS unique_facilitators
      FROM "TransferEvent" t
      WHERE 1=1
        ${chain ? Prisma.sql`AND t.chain = ${chain}` : Prisma.empty}
        ${startDate ? Prisma.sql`AND t.block_timestamp >= ${startDate}` : Prisma.empty}
        ${endDate ? Prisma.sql`AND t.block_timestamp <= ${endDate}` : Prisma.empty}
      GROUP BY bucket_start, t.chain
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
    LIMIT ${numBuckets}
  `;

  const rawResult = await queryRaw(sql, bucketedNetworkResultSchema);

  return rawResult;
};

export const getBucketedNetworksStatistics = createCachedArrayQuery({
  queryFn: getBucketedNetworksStatisticsUncached,
  cacheKeyPrefix: 'bucketed-networks-statistics',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['bucket_start'],

  tags: ['networks-statistics'],
});
