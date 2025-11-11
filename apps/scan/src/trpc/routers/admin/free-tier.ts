import { createTRPCRouter, adminProcedure } from '../../trpc';
import { getFreeTierWalletBalances } from '@/services/cdp/server-wallet/free-tier';

export const adminFreeTierRouter = createTRPCRouter({
  getWalletBalances: adminProcedure.query(async () => {
    return await getFreeTierWalletBalances();
  }),
});
