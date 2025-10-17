import { createTRPCRouter, protectedProcedure } from '@/trpc/trpc';

import {
  exportWalletFromUserId,
  getUSDCBaseBalanceFromUserId,
  getWalletAddressFromUserId,
} from '@/services/cdp/server-wallet';

export const serverWalletRouter = createTRPCRouter({
  address: protectedProcedure.query(async ({ ctx }) => {
    return await getWalletAddressFromUserId(ctx.session.user.id);
  }),

  usdcBaseBalance: protectedProcedure.query(async ({ ctx }) => {
    return await getUSDCBaseBalanceFromUserId(ctx.session.user.id);
  }),

  export: protectedProcedure.mutation(async ({ ctx }) => {
    return await exportWalletFromUserId(ctx.session.user.id);
  }),
});
