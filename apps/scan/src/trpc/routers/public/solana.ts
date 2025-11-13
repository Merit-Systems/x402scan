import z from 'zod';

import {
  getSolanaNativeBalance,
  getSolanaTokenBalance,
  getSolanaTokenBalanceSchema,
} from '@/services/solana/balance';
import { getSolanaTransactionConfirmation } from '@/services/solana/transaction';

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

  transactionConfirmation: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      return await getSolanaTransactionConfirmation(input);
    }),
});
