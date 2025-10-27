import { createTRPCRouter, adminProcedure } from '../../trpc';
import { 
  getWalletSnapshotAggregates,
  getWalletSnapshotAggregatesSchema 
} from '@/services/db/wallet-snapshot/aggregate';

export const adminWalletsRouter = createTRPCRouter({
  aggregates: adminProcedure
    .input(getWalletSnapshotAggregatesSchema.default({ days: 7 }))
    .query(async ({ input }) => {
      const aggregates = await getWalletSnapshotAggregates(input);
      
      // Convert bigint to string for JSON serialization
      return aggregates.map((agg) => ({
        timestamp: agg.timestamp,
        numWallets: agg.num_wallets,
        balance: agg.balance.toString(),
      }));
    }),
});

