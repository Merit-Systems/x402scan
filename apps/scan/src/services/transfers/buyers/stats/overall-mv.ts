import z from 'zod';
import { Prisma } from '@x402scan/transfers-db';

import { baseQuerySchema } from '../../schemas';
import { createCachedQuery, createStandardCacheKey } from '@/lib/cache';
import { queryRaw } from '@/services/transfers/client';
import { getMaterializedViewSuffix } from '@/lib/time-range';

export const buyerStatisticsMVInputSchema = baseQuerySchema;

const getOverallBuyerStatisticsMVUncached = async (
  input: z.infer<typeof buyerStatisticsMVInputSchema>
) => {
  const { timeframe } = input;
  const mvTimeframe = getMaterializedViewSuffix(timeframe);
  const tableName = `sender_stats_aggregated_${mvTimeframe}`;

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

  if (input.senders?.include && input.senders.include.length > 0) {
    conditions.push(
      Prisma.sql`AND sender = ANY(${input.senders.include})`
    );
  }

  if (input.senders?.exclude && input.senders.exclude.length > 0) {
    conditions.push(
      Prisma.sql`AND NOT (sender = ANY(${input.senders.exclude}))`
    );
  }

  const whereClause = Prisma.join(conditions, ' ');

  // Query the appropriate materialized view
  // new_buyers is omitted for now (requires sender_first_seen MV)
  const sql = Prisma.sql`
    SELECT
      COUNT(DISTINCT sender)::int AS total_buyers,
      COALESCE(SUM(total_transactions), 0)::int AS total_transactions,
      COALESCE(SUM(total_amount), 0)::float AS total_amount,
      COALESCE(SUM(unique_sellers), 0)::int AS unique_sellers,
      MAX(latest_block_timestamp) AS latest_block_timestamp,
      0::int AS new_buyers
    FROM ${Prisma.raw(tableName)}
    ${whereClause}
  `;

  const empty = {
    total_buyers: 0,
    total_transactions: 0,
    total_amount: 0,
    unique_sellers: 0,
    latest_block_timestamp: null as Date | null,
    new_buyers: 0,
  };

  try {
    const result = await queryRaw(
      sql,
      z.array(
        z.object({
          total_buyers: z.number(),
          total_transactions: z.number(),
          total_amount: z.number(),
          unique_sellers: z.number(),
          latest_block_timestamp: z.date().nullable(),
          new_buyers: z.number(),
        })
      )
    );

    return result[0] ?? empty;
  } catch (error) {
    // Gracefully handle missing materialized views (e.g. during first deploy)
    if (String(error).includes('does not exist')) {
      console.warn(`[buyer-stats] MV ${tableName} not yet available, returning empty`);
      return empty;
    }
    throw error;
  }
};

export const getOverallBuyerStatisticsMV = createCachedQuery({
  queryFn: getOverallBuyerStatisticsMVUncached,
  cacheKeyPrefix: 'overall-buyer-statistics-mv',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['latest_block_timestamp'],
  tags: ['statistics', 'buyers'],
});
