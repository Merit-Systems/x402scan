import {
  createTRPCRouter,
  paginatedProcedure,
  publicProcedure,
} from '../../trpc';
import {
  listTopBuyersMV,
  listTopBuyersMVInputSchema,
} from '@/services/transfers/buyers/list-mv';
import { buyerStatisticsMVInputSchema } from '@/services/transfers/buyers/stats/overall-mv';
import { bucketedBuyerStatisticsMVInputSchema } from '@/services/transfers/buyers/stats/bucketed-mv';
import { getOverallBuyerStatisticsMV } from '@/services/transfers/buyers/stats/overall-mv';
import { getBucketedBuyerStatisticsMV } from '@/services/transfers/buyers/stats/bucketed-mv';
import {
  listBuyerSellers,
  listBuyerSellersInputSchema,
} from '@/services/transfers/buyers/sellers/list';

export const buyersRouter = createTRPCRouter({
  all: {
    list: paginatedProcedure
      .input(listTopBuyersMVInputSchema)
      .query(async ({ input, ctx: { pagination } }) => {
        return await listTopBuyersMV(input, pagination);
      }),
    stats: {
      overall: publicProcedure
        .input(buyerStatisticsMVInputSchema)
        .query(async ({ input, ctx }) => {
          return await getOverallBuyerStatisticsMV(input, ctx);
        }),

      bucketed: publicProcedure
        .input(bucketedBuyerStatisticsMVInputSchema)
        .query(async ({ input, ctx }) => {
          return await getBucketedBuyerStatisticsMV(input, ctx);
        }),
    },
    sellers: paginatedProcedure
      .input(listBuyerSellersInputSchema)
      .query(async ({ input, ctx: { pagination } }) => {
        return await listBuyerSellers(input, pagination);
      }),
  },
});
