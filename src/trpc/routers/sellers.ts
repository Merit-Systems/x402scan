import { createTRPCRouter, infiniteQueryProcedure } from '../trpc';
import z from 'zod';
import {
  listTopSellers,
  listTopSellersInputSchema,
} from '@/services/cdp/sql/sellers/list';
import {
  listBazaarSellers,
  listBazaarSellersInputSchema,
} from '@/services/aggregator/bazaar';

export const sellersRouter = createTRPCRouter({
  list: {
    all: infiniteQueryProcedure(z.bigint())
      .input(listTopSellersInputSchema)
      .query(async ({ input, ctx: { pagination } }) => {
        return await listTopSellers(input, pagination);
      }),
    bazaar: infiniteQueryProcedure(z.bigint())
      .input(listBazaarSellersInputSchema)
      .query(async ({ input, ctx: { pagination } }) => {
        return await listBazaarSellers(input, pagination);
      }),
  },
});
