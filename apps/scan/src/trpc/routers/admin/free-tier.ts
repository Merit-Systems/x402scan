import { Chain } from '@/types/chain';
import { createTRPCRouter, adminProcedure } from '../../trpc';
import { freeTierWallets } from '@/services/cdp/server-wallet/free-tier';

export const adminFreeTierRouter = createTRPCRouter({
  address: adminProcedure.query(async () => {
    return await freeTierWallets[Chain.BASE].address();
  }),
});
