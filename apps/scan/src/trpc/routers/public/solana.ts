import {
  getLatestBlockhash,
  getSolanaNativeBalance,
  getSolanaTokenBalance,
  getSolanaTokenBalanceSchema,
  getSolanaTransactionConfirmation,
} from '@/services/solana/token-balance';
import { createTRPCRouter, publicProcedure } from '../../trpc';
import { solanaAddressSchema } from '@/lib/schemas';
import z from 'zod';

export const solanaRouter = createTRPCRouter({
  balance: publicProcedure
    .input(getSolanaTokenBalanceSchema)
    .query(async ({ input }) => {
      return await getSolanaTokenBalance(input);
    }),

  latestBlockhash: publicProcedure.query(async () => {
    return await getLatestBlockhash();
  }),

  nativeBalance: publicProcedure
    .input(solanaAddressSchema)
    .query(async ({ input }) => {
      return await getSolanaNativeBalance(input);
    }),

  transactionConfirmation: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      return await getSolanaTransactionConfirmation(input);
    }),
});
