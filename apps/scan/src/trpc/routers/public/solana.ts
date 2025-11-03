import {
  getSolanaTokenBalance,
  getSolanaTokenBalanceSchema,
} from '@/services/solana/token-balance';
import { createTRPCRouter, publicProcedure } from '../../trpc';

export const solanaRouter = createTRPCRouter({
  balance: publicProcedure
    .input(getSolanaTokenBalanceSchema)
    .query(async ({ input }) => {
      return await getSolanaTokenBalance(input);
    }),
});
