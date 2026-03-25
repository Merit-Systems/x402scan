import z from 'zod';
import { Prisma } from '@x402scan/transfers-db';

import { queryRaw } from '@/services/transfers/client';
import { createCachedQuery, createStandardCacheKey } from '@/lib/cache';
import { chainSchema } from '@/lib/schemas';
import { getMaterializedViewSuffix } from '@/lib/time-range';

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type WalletStatsInput = {
  address: string;
  chain?: 'base' | 'solana' | 'stellar';
  timeframe: number;
};

const getWalletStatsUncached = async (input: WalletStatsInput) => {
  const { address, chain, timeframe } = input;
  const mvTimeframe = getMaterializedViewSuffix(timeframe);
  const tableName = `sender_stats_aggregated_${mvTimeframe}`;

  const conditions: Prisma.Sql[] = [Prisma.sql`WHERE sender = ${address}`];

  if (chain) {
    conditions.push(Prisma.sql`AND chain = ${chain}`);
  }

  const whereClause = Prisma.join(conditions, ' ');

  const empty = {
    total_transactions: 0,
    total_amount: 0,
    unique_recipients: 0,
    chains: [] as string[],
  };

  try {
    const result = await queryRaw(
      Prisma.sql`
        SELECT
          COALESCE(SUM(total_transactions), 0)::int AS total_transactions,
          COALESCE(SUM(total_amount), 0)::float AS total_amount,
          COALESCE(SUM(unique_sellers), 0)::int AS unique_recipients,
          COALESCE(ARRAY_AGG(DISTINCT chain) FILTER (WHERE chain IS NOT NULL), ARRAY[]::text[]) AS chains
        FROM ${Prisma.raw(tableName)}
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

    return result[0] ?? empty;
  } catch (error) {
    if (String(error).includes('does not exist')) {
      console.warn(`[wallet-stats] MV ${tableName} not yet available, returning empty`);
      return empty;
    }
    throw error;
  }
};

export const getWalletStats = createCachedQuery({
  queryFn: getWalletStatsUncached,
  cacheKeyPrefix: 'wallet-stats',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: [],
  tags: ['wallets'],
});
