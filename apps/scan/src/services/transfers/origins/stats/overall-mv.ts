import z from 'zod';
import { Prisma } from '@x402scan/transfers-db';

import { baseQuerySchema } from '../../schemas';
import { createCachedQuery, createStandardCacheKey } from '@/lib/cache';
import { queryRaw } from '@/services/transfers/client';
import { getMaterializedViewSuffix } from '@/lib/time-range';

export const originStatisticsMVInputSchema = baseQuerySchema.extend({
  originIds: z.array(z.string()).optional(),
});

const getOverallOriginStatisticsMVUncached = async (
  input: z.infer<typeof originStatisticsMVInputSchema>
) => {
  const { timeframe } = input;
  const mvTimeframe = getMaterializedViewSuffix(timeframe);
  const tableName = `origin_stats_aggregated_${mvTimeframe}`;

  // Build WHERE clause for materialized view
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

  // Query the appropriate materialized view
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

// Single origin stats - for querying a specific origin
export const singleOriginStatsMVInputSchema = baseQuerySchema.extend({
  originId: z.string(),
});

const getSingleOriginStatsMVUncached = async (
  input: z.infer<typeof singleOriginStatsMVInputSchema>
) => {
  const { timeframe, originId } = input;
  const mvTimeframe = getMaterializedViewSuffix(timeframe);
  const tableName = `origin_stats_aggregated_${mvTimeframe}`;

  // Build WHERE clause for materialized view
  const conditions: Prisma.Sql[] = [Prisma.sql`WHERE "originId" = ${originId}`];

  if (input.facilitatorIds && input.facilitatorIds.length > 0) {
    conditions.push(
      Prisma.sql`AND ${input.facilitatorIds}::text[] && facilitator_ids`
    );
  }

  if (input.chain) {
    conditions.push(Prisma.sql`AND chain = ${input.chain}`);
  }

  const whereClause = Prisma.join(conditions, ' ');

  // Query the appropriate materialized view
  const sql = Prisma.sql`
    SELECT 
      "originId",
      COALESCE(SUM(total_transactions), 0)::int AS total_transactions,
      COALESCE(SUM(total_amount), 0)::float AS total_amount,
      COALESCE(SUM(unique_buyers), 0)::int AS unique_buyers,
      MAX(latest_block_timestamp) AS latest_block_timestamp
    FROM ${Prisma.raw(tableName)}
    ${whereClause}
    GROUP BY "originId"
  `;

  const result = await queryRaw(
    sql,
    z.array(
      z.object({
        originId: z.string(),
        total_transactions: z.number(),
        total_amount: z.number(),
        unique_buyers: z.number(),
        latest_block_timestamp: z.date().nullable(),
      })
    )
  );

  return (
    result[0] ?? {
      originId,
      total_transactions: 0,
      total_amount: 0,
      unique_buyers: 0,
      latest_block_timestamp: null,
    }
  );
};

export const getSingleOriginStatsMV = createCachedQuery({
  queryFn: getSingleOriginStatsMVUncached,
  cacheKeyPrefix: 'single-origin-statistics-mv',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['latest_block_timestamp'],
  tags: ['statistics', 'origins'],
});
