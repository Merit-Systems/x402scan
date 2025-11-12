import z from 'zod';

import { Prisma } from '@prisma/client';

import { baseBucketedQuerySchema } from '../schemas';


import { queryRaw } from '@/services/transfers/client';

import { createCachedArrayQuery, createStandardCacheKey } from '@/lib/cache';
import { facilitators } from '@/lib/facilitators';
import { getMaterializedViewSuffix } from '@/lib/time-range';

export const bucketedStatisticsInputSchema = baseBucketedQuerySchema;

const getBucketedFacilitatorsStatisticsUncached = async (
  input: z.infer<typeof bucketedStatisticsInputSchema>
) => {
  const { timeframe, chain } = input;

  const mvTimeframe = getMaterializedViewSuffix(timeframe);
  const tableName = `stats_buckets_${mvTimeframe}`;

  const chainFacilitators = chain
    ? facilitators.filter(f => f.addresses[chain] !== undefined)
    : facilitators;

  const facilitatorIds = chainFacilitators.map(f => f.id);

  // Build WHERE clause for materialized view
  const conditions: Prisma.Sql[] = [Prisma.sql`WHERE 1=1`];

  if (input.facilitatorIds && input.facilitatorIds.length > 0) {
    conditions.push(
      Prisma.sql`AND facilitator_id = ANY(${input.facilitatorIds})`
    );
  } else if (facilitatorIds.length > 0) {
    conditions.push(Prisma.sql`AND facilitator_id = ANY(${facilitatorIds})`);
  }

  if (input.chain) {
    conditions.push(Prisma.sql`AND chain = ${input.chain}`);
  }

  const whereClause = Prisma.join(conditions, ' ');

  // Query the appropriate materialized view
  const sql = Prisma.sql`
    WITH bucket_stats AS (
      SELECT
        bucket AS bucket_start,
        facilitator_id,
        SUM(total_transactions)::int AS total_transactions,
        SUM(total_amount)::float AS total_amount,
        SUM(unique_buyers)::int AS unique_buyers,
        SUM(unique_sellers)::int AS unique_sellers
      FROM ${Prisma.raw(tableName)}
      ${whereClause}
      GROUP BY bucket, facilitator_id
    ),
    active_facilitators AS (
      SELECT DISTINCT facilitator_id FROM bucket_stats
    ),
    all_buckets AS (
      SELECT DISTINCT bucket_start FROM bucket_stats
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
        COALESCE(bs.total_transactions, 0)::int AS total_transactions,
        COALESCE(bs.total_amount, 0)::float AS total_amount,
        COALESCE(bs.unique_buyers, 0)::int AS unique_buyers,
        COALESCE(bs.unique_sellers, 0)::int AS unique_sellers
      FROM all_combinations ac
      LEFT JOIN bucket_stats bs
        ON ac.bucket_start = bs.bucket_start
        AND ac.facilitator_id = bs.facilitator_id
    )
    SELECT
      bucket_start,
      jsonb_object_agg(
        facilitator_id,
        jsonb_build_object(
          'total_transactions', total_transactions,
          'total_amount', total_amount,
          'unique_buyers', unique_buyers,
          'unique_sellers', unique_sellers
        )
      ) AS facilitators
    FROM combined_stats
    GROUP BY bucket_start
    ORDER BY bucket_start
  `;

  const rawResult = await queryRaw(
    sql,
    z.array(
      z.object({
        bucket_start: z.date(),
        facilitators: z.record(
          z.string(),
          z.object({
            total_transactions: z.number(),
            total_amount: z.number(),
            unique_buyers: z.number(),
            unique_sellers: z.number(),
          })
        ),
      })
    )
  );

  return rawResult;
};

export const getBucketedFacilitatorsStatistics = createCachedArrayQuery({
  queryFn: getBucketedFacilitatorsStatisticsUncached,
  cacheKeyPrefix: 'bucketed-facilitators-statistics-test',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['bucket_start'],
  tags: ['facilitators-statistics'],
});
