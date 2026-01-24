import z from 'zod';
import { Prisma } from '@x402scan/transfers-db';

import { createCachedArrayQuery, createStandardCacheKey } from '@/lib/cache';
import { queryRaw } from '@/services/transfers/client';
import { getMaterializedViewSuffix } from '@/lib/time-range';
import { timeframeSchema } from '@/lib/schemas';

export const buyerResourceUsageInputSchema = z.object({
  wallet: z.string(),
  timeframe: timeframeSchema,
  limit: z.number().default(20),
});

const getTimeframeInterval = (mvTimeframe: string): string | null => {
  const intervalMap: Record<string, string> = {
    '1d': '1 day',
    '7d': '7 days',
    '14d': '14 days',
    '30d': '30 days',
  };
  return intervalMap[mvTimeframe] ?? null;
};

const resourceUsageResultSchema = z.array(
  z.object({
    recipient: z.string(),
    total_transactions: z.number(),
    total_amount: z.number(),
    last_used: z.date(),
  })
);

const getBuyerResourceUsageUncached = async (
  input: z.infer<typeof buyerResourceUsageInputSchema>
) => {
  const { wallet, timeframe, limit } = input;
  const mvTimeframe = getMaterializedViewSuffix(timeframe);
  const interval = getTimeframeInterval(mvTimeframe);

  // Query TransferEvent grouped by recipient to show which resources/sellers the buyer used
  // Try both original case and lowercase to handle different storage formats
  const walletLower = wallet.toLowerCase();

  const sql = interval
    ? Prisma.sql`
      SELECT
        recipient,
        COUNT(*)::int AS total_transactions,
        COALESCE(SUM(amount), 0)::float AS total_amount,
        MAX(block_timestamp) AS last_used
      FROM "TransferEvent"
      WHERE sender IN (${wallet}, ${walletLower})
        AND block_timestamp >= NOW() - ${Prisma.raw(`INTERVAL '${interval}'`)}
      GROUP BY recipient
      ORDER BY total_amount DESC
      LIMIT ${limit}
    `
    : Prisma.sql`
      SELECT
        recipient,
        COUNT(*)::int AS total_transactions,
        COALESCE(SUM(amount), 0)::float AS total_amount,
        MAX(block_timestamp) AS last_used
      FROM "TransferEvent"
      WHERE sender IN (${wallet}, ${walletLower})
      GROUP BY recipient
      ORDER BY total_amount DESC
      LIMIT ${limit}
    `;

  return queryRaw(sql, resourceUsageResultSchema);
};

export const getBuyerResourceUsage = createCachedArrayQuery({
  queryFn: getBuyerResourceUsageUncached,
  cacheKeyPrefix: 'buyer-resource-usage',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['last_used'],
  tags: ['statistics', 'buyers'],
});
