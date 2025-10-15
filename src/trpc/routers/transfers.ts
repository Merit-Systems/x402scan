import {
  getFacilitatorTransfer,
  getFacilitatorTransferInputSchema,
} from '@/services/indexer/transfers/get';
import { createTRPCRouter, publicProcedure } from '../trpc';
import {
  listFacilitatorTransfersInputSchema,
  listFacilitatorTransfers,
} from '@/services/indexer/transfers/list';

export const transfersRouter = createTRPCRouter({
  get: publicProcedure
    .input(getFacilitatorTransferInputSchema)
    .query(async ({ input }) => {
      return await getFacilitatorTransfer(input);
    }),

  list: publicProcedure
    .input(listFacilitatorTransfersInputSchema)
    .query(async ({ input }) => {
      return await listFacilitatorTransfers(input);
    }),
});
