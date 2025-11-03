import { createTRPCRouter, paginatedProcedure } from '../../trpc';
import {
  listFacilitatorTransfersInputSchema,
  listFacilitatorTransfers,
} from '@/services/transfers/transfers/list';

export const transfersRouter = createTRPCRouter({
  list: paginatedProcedure
    .input(listFacilitatorTransfersInputSchema)
    .query(async ({ input, ctx: { pagination } }) => {
      return await listFacilitatorTransfers(input, pagination);
    }),
});
