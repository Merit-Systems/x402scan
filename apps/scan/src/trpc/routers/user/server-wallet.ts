import { createTRPCRouter, protectedProcedure } from '@/trpc/trpc';

import {
  exportWalletFromUserId,
  getEthBaseBalanceFromUserId,
  getUSDCBaseBalanceFromUserId,
  getWalletAddressFromUserId,
  sendServerWalletUSDC,
  sendUsdcSchema,
} from '@/services/cdp/server-wallet/user';

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

  ethBaseBalance: protectedProcedure.query(async ({ ctx }) => {
    return await getEthBaseBalanceFromUserId(ctx.session.user.id);
  }),

  sendUSDC: protectedProcedure
    .input(sendUsdcSchema)
    .mutation(async ({ ctx, input }) => {
      return await sendServerWalletUSDC(ctx.session.user.id, input);
    }),
});
