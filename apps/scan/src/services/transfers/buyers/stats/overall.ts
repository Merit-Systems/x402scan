import z from 'zod';
import { Prisma } from '@x402scan/transfers-db';

import { createCachedQuery, createStandardCacheKey } from '@/lib/cache';
import { queryRaw } from '@/services/transfers/client';
import { getMaterializedViewSuffix } from '@/lib/time-range';
import { timeframeSchema } from '@/lib/schemas';

export const buyerStatsInputSchema = z.object({
  wallet: z.string(),
  timeframe: timeframeSchema,
});

const getBuyerStatsUncached = async (
  input: z.infer<typeof buyerStatsInputSchema>
) => {
  const { wallet, timeframe } = input;
  const mvTimeframe = getMaterializedViewSuffix(timeframe);
  const tableName = `sender_stats_aggregated_${mvTimeframe}`;

  // Query the sender stats materialized view
  // Try both original case and lowercase to handle different storage formats
  const walletLower = wallet.toLowerCase();

  const sql = Prisma.sql`
    SELECT
      COALESCE(SUM(total_transactions), 0)::int AS total_transactions,
      COALESCE(SUM(total_amount), 0)::float AS total_amount,
      COALESCE(SUM(unique_sellers), 0)::int AS unique_sellers,
      MAX(latest_block_timestamp) AS latest_transaction
    FROM ${Prisma.raw(tableName)}
    WHERE sender IN (${wallet}, ${walletLower})
  `;

  const result = await queryRaw(
    sql,
    z.array(
      z.object({
        total_transactions: z.number(),
        total_amount: z.number(),
        unique_sellers: z.number(),
        latest_transaction: z.date().nullable(),
      })
    )
  );

  return (
    result[0] ?? {
      total_transactions: 0,
      total_amount: 0,
      unique_sellers: 0,
      latest_transaction: null,
    }
  );
};

export const getBuyerStats = createCachedQuery({
  queryFn: getBuyerStatsUncached,
  cacheKeyPrefix: 'buyer-stats',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['latest_transaction'],
  tags: ['statistics', 'buyers'],
});
