import { createTRPCRouter, protectedProcedure } from '@/trpc/trpc';

import {
  getOrCreateWalletFromUserId,
  getUSDCBaseBalanceFromUserId,
  getWalletAddressFromUserId,
} from '@/services/cdp/server-wallet/get-or-create';

export const serverWalletRouter = createTRPCRouter({
  wallet: protectedProcedure.query(async ({ ctx }) => {
    return await getOrCreateWalletFromUserId(ctx.session.user.id);
  }),

  address: protectedProcedure.query(async ({ ctx }) => {
    return await getWalletAddressFromUserId(ctx.session.user.id);
  }),

  usdcBaseBalance: protectedProcedure.query(async ({ ctx }) => {
    return await getUSDCBaseBalanceFromUserId(ctx.session.user.id);
  }),
});
