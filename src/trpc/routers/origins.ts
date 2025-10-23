import { mixedAddressSchema } from '@/lib/schemas';
import { createTRPCRouter, publicProcedure } from '../trpc';
import {
  listOriginsByAddress,
  listOriginsWithResources,
  listOriginsWithResourcesByAddress,
  listOriginsWithResourcesSchema,
  searchOrigins,
  searchOriginsSchema,
} from '@/services/db/origin';

export const originsRouter = createTRPCRouter({
  list: {
    byAddress: publicProcedure
      .input(mixedAddressSchema)
      .query(async ({ input }) => {
        return await listOriginsByAddress(input);
      }),

    withResources: {
      all: publicProcedure
        .input(listOriginsWithResourcesSchema)
        .query(async ({ input }) => {
          return await listOriginsWithResources(input);
        }),
      byAddress: publicProcedure
        .input(mixedAddressSchema)
        .query(async ({ input }) => {
          return await listOriginsWithResourcesByAddress(input);
        }),
    },
  },
  search: publicProcedure
    .input(searchOriginsSchema)
    .query(async ({ input }) => {
      return await searchOrigins(input);
    }),
});
