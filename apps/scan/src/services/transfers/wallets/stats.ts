import z from 'zod';
import { Prisma } from '@x402scan/transfers-db';

import { queryRaw } from '@/services/transfers/client';
import { createCachedQuery, createStandardCacheKey } from '@/lib/cache';
import { chainSchema } from '@/lib/schemas';
import { getTimeRangeFromTimeframe } from '@/lib/time-range';

interface WalletStatsInput {
  address: string;
  chain?: 'base' | 'solana';
  timeframe: number;
}

const getWalletStatsUncached = async (input: WalletStatsInput) => {
  const { address, chain, timeframe } = input;
  const { startDate, endDate } = getTimeRangeFromTimeframe(timeframe);

  const conditions: Prisma.Sql[] = [Prisma.sql`WHERE sender = ${address}`];

  if (chain) {
    conditions.push(Prisma.sql`AND chain = ${chain}`);
  }
  if (startDate) {
    conditions.push(
      Prisma.sql`AND block_timestamp >= ${startDate.toISOString()}::timestamp`
    );
  }
  if (endDate && startDate) {
    conditions.push(
      Prisma.sql`AND block_timestamp <= ${endDate.toISOString()}::timestamp`
    );
  }

  const whereClause = Prisma.join(conditions, ' ');

  const result = await queryRaw(
    Prisma.sql`
      SELECT
        COUNT(*)::int AS total_transactions,
        COALESCE(SUM(amount), 0)::float AS total_amount,
        COUNT(DISTINCT recipient)::int AS unique_recipients,
        ARRAY_AGG(DISTINCT chain) AS chains
      FROM "TransferEvent"
      ${whereClause}
    `,
    z.array(
      z.object({
        total_transactions: z.number(),
        total_amount: z.number(),
        unique_recipients: z.number(),
        chains: z.array(chainSchema),
      })
    )
  );

  return (
    result[0] ?? {
      total_transactions: 0,
      total_amount: 0,
      unique_recipients: 0,
      chains: [],
    }
  );
};

export const getWalletStats = createCachedQuery({
  queryFn: getWalletStatsUncached,
  cacheKeyPrefix: 'wallet-stats',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: [],
  tags: ['wallets'],
});
