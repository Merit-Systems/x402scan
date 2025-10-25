import z from 'zod';

import { Prisma } from '@prisma/client';

import { baseBucketedQuerySchema } from '../schemas';
import { createCachedArrayQuery, createStandardCacheKey } from '@/lib/cache';
import { facilitators } from '@/lib/facilitators';
import { queryRaw } from '@/services/transfers/client';
import { transfersWhereClause } from '../query-utils';

export const bucketedStatisticsInputSchema = baseBucketedQuerySchema;

const getBucketedFacilitatorsStatisticsUncached = async (
  input: z.infer<typeof bucketedStatisticsInputSchema>
) => {
  const { startDate, endDate, numBuckets, chain } = input;

  const chainFacilitators = chain
    ? facilitators.filter(f => f.addresses[chain] !== undefined)
    : facilitators;

  const timeRangeMs = endDate.getTime() - startDate.getTime();
  const bucketSizeSeconds = Math.max(
    1,
    Math.floor(timeRangeMs / numBuckets / 1000)
  );

  const facilitatorIds = chainFacilitators.map(f => f.id);

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
    facilitator_list AS (
      SELECT unnest(${facilitatorIds}::text[]) AS facilitator_id
    ),
    all_combinations AS (
      SELECT ab.bucket_start, fl.facilitator_id
      FROM all_buckets ab
      CROSS JOIN facilitator_list fl
    ),
    bucket_stats AS (
      SELECT 
        to_timestamp(
          floor(extract(epoch from t.block_timestamp) / ${bucketSizeSeconds}) * ${bucketSizeSeconds}
        ) AS bucket_start,
        t.facilitator_id,
        COUNT(*)::int AS total_transactions,
        SUM(t.amount)::float AS total_amount,
        COUNT(DISTINCT t.sender)::int AS unique_buyers,
        COUNT(DISTINCT t.recipient)::int AS unique_sellers
      FROM "TransferEvent" t
      ${transfersWhereClause(input)}
      GROUP BY bucket_start, facilitator_id
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
    LIMIT ${numBuckets}
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
  cacheKeyPrefix: 'bucketed-facilitators-statistics',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['bucket_start'],
  tags: ['facilitators-statistics'],
});
