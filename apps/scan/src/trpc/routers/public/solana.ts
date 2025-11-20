import {
  getSolanaNativeBalance,
  getSolanaTokenBalance,
  getSolanaTokenBalanceSchema,
} from '@/services/solana/balance';

import { createTRPCRouter, publicProcedure } from '../../trpc';

import { solanaAddressSchema } from '@/lib/schemas';

export const solanaRouter = createTRPCRouter({
  balance: publicProcedure
    .input(getSolanaTokenBalanceSchema)
    .query(async ({ input }) => {
      return await getSolanaTokenBalance(input);
    }),

  nativeBalance: publicProcedure
    .input(solanaAddressSchema)
    .query(async ({ input }) => {
      return await getSolanaNativeBalance(input);
    }),
});
