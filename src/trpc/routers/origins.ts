import { ethereumAddressSchema } from '@/lib/schemas';
import {
  createTRPCRouter,
  publicProcedure,
  infiniteQueryProcedure,
} from '../trpc';
import {
  listOriginsByAddress,
  listOriginsWithResources,
  listOriginsWithResourcesByAddress,
  searchOrigins,
  searchOriginsSchema,
} from '@/services/db/origin';
import {
  aggregateOrigins,
  aggregateOriginsInputSchema,
} from '@/services/aggregator/origin-traffic';
import z from 'zod';

export const originsRouter = createTRPCRouter({
  list: {
    byAddress: publicProcedure
      .input(ethereumAddressSchema)
      .query(async ({ input }) => {
        return await listOriginsByAddress(input);
      }),

    withResources: {
      all: publicProcedure.query(async () => {
        return await listOriginsWithResources();
      }),
      byAddress: publicProcedure
        .input(ethereumAddressSchema)
        .query(async ({ input }) => {
          return await listOriginsWithResourcesByAddress(input);
        }),
    },

    aggregated: infiniteQueryProcedure(z.bigint())
      .input(aggregateOriginsInputSchema)
      .query(async ({ input, ctx: { pagination } }) => {
        return await aggregateOrigins(input, pagination);
      }),
  },
  search: publicProcedure
    .input(searchOriginsSchema)
    .query(async ({ input }) => {
      return await searchOrigins(input);
    }),
});
