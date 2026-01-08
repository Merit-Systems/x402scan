import z from 'zod';
import { Prisma } from '@x402scan/transfers-db';

import { createCachedArrayQuery, createStandardCacheKey } from '@/lib/cache';
import { queryRaw } from '@/services/transfers/client';
import { getMaterializedViewSuffix } from '@/lib/time-range';
import { chainSchema, timeframeSchema } from '@/lib/schemas';

/**
 * Input schema for bucketed origin statistics queries.
 * This queries the pre-joined origin_stats_bucketed_* views,
 * eliminating the need to pass thousands of recipient addresses.
 */
export const bucketedOriginStatisticsMVInputSchema = z.object({
  chain: chainSchema.optional(),
  timeframe: timeframeSchema,
  // Optional origin IDs to filter by specific origins
  originIds: z.array(z.string()).optional(),
});

export type BucketedOriginStatisticsMVInput = z.infer<
  typeof bucketedOriginStatisticsMVInputSchema
>;

const getBucketedOriginStatisticsMVUncached = async (
  input: BucketedOriginStatisticsMVInput
) => {
  const { timeframe } = input;
  const mvTimeframe = getMaterializedViewSuffix(timeframe);
  const tableName = `origin_stats_bucketed_${mvTimeframe}`;

  // Build WHERE clause
  // Note: bucketed views don't have facilitator_ids column
  const conditions: Prisma.Sql[] = [Prisma.sql`WHERE 1=1`];

  if (input.chain) {
    conditions.push(Prisma.sql`AND chain = ${input.chain}`);
  }

  if (input.originIds && input.originIds.length > 0) {
    conditions.push(Prisma.sql`AND "originId" = ANY(${input.originIds})`);
  }

  const whereClause = Prisma.join(conditions, ' ');

  // Query the origin_stats_bucketed view which is pre-joined with payto_origin_map
  const sql = Prisma.sql`
    SELECT 
      bucket AS bucket_start,
      COUNT(DISTINCT "originId")::int AS total_origins,
      COALESCE(SUM(total_transactions), 0)::int AS total_transactions,
      COALESCE(SUM(total_amount), 0)::float AS total_amount,
      COALESCE(SUM(unique_buyers), 0)::int AS unique_buyers
    FROM ${Prisma.raw(tableName)}
    ${whereClause}
    GROUP BY bucket
    ORDER BY bucket ASC
  `;

  return queryRaw(
    sql,
    z.array(
      z.object({
        bucket_start: z.date(),
        total_origins: z.number(),
        total_transactions: z.number(),
        total_amount: z.number(),
        unique_buyers: z.number(),
      })
    )
  );
};

export const getBucketedOriginStatisticsMV = createCachedArrayQuery({
  queryFn: getBucketedOriginStatisticsMVUncached,
  cacheKeyPrefix: 'bucketed-origin-statistics-mv',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['bucket_start'],
  tags: ['statistics', 'origins'],
});
