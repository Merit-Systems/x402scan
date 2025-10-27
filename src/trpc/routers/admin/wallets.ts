import { z } from 'zod';
import { createTRPCRouter, adminProcedure } from '../../trpc';
import { getWalletSnapshotAggregates } from '@/services/db/wallet-snapshot/aggregate';

export const adminWalletsRouter = createTRPCRouter({
  aggregates: adminProcedure
    .input(
      z.object({
        days: z.number().int().positive().default(7),
      })
    )
    .query(async ({ input }) => {
      const aggregates = await getWalletSnapshotAggregates(input.days);
      
      // Convert bigint to string for JSON serialization
      return aggregates.map((agg) => ({
        timestamp: agg.timestamp,
        numWallets: agg.num_wallets,
        balance: agg.balance.toString(),
      }));
    }),
});

