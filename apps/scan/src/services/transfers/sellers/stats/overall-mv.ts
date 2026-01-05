import z from 'zod';
import { Prisma } from '@x402scan/transfers-db';

import { baseQuerySchema } from '../../schemas';
import { createCachedQuery, createStandardCacheKey } from '@/lib/cache';
import { queryRaw } from '@/services/transfers/client';
import { getMaterializedViewSuffix } from '@/lib/time-range';

export const sellerStatisticsMVInputSchema = baseQuerySchema;

const getOverallSellerStatisticsMVUncached = async (
  input: z.infer<typeof sellerStatisticsMVInputSchema>
) => {
  const { timeframe } = input;
  const mvTimeframe = getMaterializedViewSuffix(timeframe);
  const tableName = `recipient_stats_aggregated_${mvTimeframe}`;

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

  if (input.recipients?.include && input.recipients.include.length > 0) {
    conditions.push(
      Prisma.sql`AND recipient = ANY(${input.recipients.include})`
    );
  }

  if (input.recipients?.exclude && input.recipients.exclude.length > 0) {
    conditions.push(
      Prisma.sql`AND NOT (recipient = ANY(${input.recipients.exclude}))`
    );
  }

  const whereClause = Prisma.join(conditions, ' ');

  // Query the appropriate materialized view
  const sql = Prisma.sql`
    SELECT 
      COUNT(DISTINCT recipient)::int AS total_sellers,
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
        total_sellers: z.number(),
        total_transactions: z.number(),
        total_amount: z.number(),
        unique_buyers: z.number(),
        latest_block_timestamp: z.date().nullable(),
      })
    )
  );

  const baseResult = result[0] ?? {
    total_sellers: 0,
    total_transactions: 0,
    total_amount: 0,
    unique_buyers: 0,
    latest_block_timestamp: null,
  };

  // Add new_sellers as 0 for backwards compatibility (MVs don't track first transaction dates)
  //TODO: Remove this once MVs are updated to track first transaction dates
  return {
    ...baseResult,
    new_sellers: 0,
  };
};

export const getOverallSellerStatisticsMV = createCachedQuery({
  queryFn: getOverallSellerStatisticsMVUncached,
  cacheKeyPrefix: 'overall-seller-statistics-mv',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['latest_block_timestamp'],
  tags: ['statistics', 'sellers'],
});
