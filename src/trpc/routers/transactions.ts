import { createTRPCRouter, publicProcedure } from '../trpc';

import {
  getTransaction,
  getTransactionInputSchema,
} from '@/services/indexer/transactions/get';

export const transactionsRouter = createTRPCRouter({
  get: publicProcedure
    .input(getTransactionInputSchema)
    .query(async ({ input }) => {
      return await getTransaction(input);
    }),
});
