import z from 'zod';
import { Prisma } from '@x402scan/transfers-db';

import { createCachedQuery, createStandardCacheKey } from '@/lib/cache';
import { queryRaw } from '@/services/transfers/client';
import { getMaterializedViewSuffix } from '@/lib/time-range';
import { chainSchema, timeframeSchema } from '@/lib/schemas';

/**
 * Input schema for origin-based statistics queries.
 * This queries the pre-joined origin_stats_aggregated_* views,
 * eliminating the need to pass thousands of recipient addresses.
 */
export const originStatisticsMVInputSchema = z.object({
  chain: chainSchema.optional(),
  facilitatorIds: z.array(z.string()).optional(),
  timeframe: timeframeSchema,
  // Optional origin IDs to filter by specific origins
  originIds: z.array(z.string()).optional(),
});

type OriginStatisticsMVInput = z.infer<typeof originStatisticsMVInputSchema>;

const getOverallOriginStatisticsMVUncached = async (
  input: OriginStatisticsMVInput
) => {
  const { timeframe } = input;
  const mvTimeframe = getMaterializedViewSuffix(timeframe);
  const tableName = `origin_stats_aggregated_${mvTimeframe}`;

  // Build WHERE clause
  const conditions: Prisma.Sql[] = [Prisma.sql`WHERE 1=1`];

  if (input.facilitatorIds && input.facilitatorIds.length > 0) {
    conditions.push(
      Prisma.sql`AND ${input.facilitatorIds}::text[] && facilitator_ids`
    );
  }

  if (input.chain) {
    conditions.push(Prisma.sql`AND chain = ${input.chain}`);
  }

  if (input.originIds && input.originIds.length > 0) {
    conditions.push(Prisma.sql`AND "originId" = ANY(${input.originIds})`);
  }

  const whereClause = Prisma.join(conditions, ' ');

  // Query the origin_stats_aggregated view which is pre-joined with payto_origin_map
  const sql = Prisma.sql`
    SELECT 
      COUNT(DISTINCT "originId")::int AS total_origins,
      COALESCE(SUM(total_transactions), 0)::int AS total_transactions,
      COALESCE(SUM(total_amount), 0)::float AS total_amount,
      COALESCE(SUM(unique_buyers), 0)::int AS unique_buyers,
      MAX(latest_block_timestamp) AS latest_block_timestamp
    FROM ${Prisma.raw(tableName)}
    ${whereClause}
  `;

  const result = await queryRaw(
    sql,
    z.array(
      z.object({
        total_origins: z.number(),
        total_transactions: z.number(),
        total_amount: z.number(),
        unique_buyers: z.number(),
        latest_block_timestamp: z.date().nullable(),
      })
    )
  );

  return (
    result[0] ?? {
      total_origins: 0,
      total_transactions: 0,
      total_amount: 0,
      unique_buyers: 0,
      latest_block_timestamp: null,
    }
  );
};

export const getOverallOriginStatisticsMV = createCachedQuery({
  queryFn: getOverallOriginStatisticsMVUncached,
  cacheKeyPrefix: 'overall-origin-statistics-mv',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['latest_block_timestamp'],
  tags: ['statistics', 'origins'],
});
