import { ethereumAddressSchema } from '@/lib/schemas';
import { createTRPCRouter, publicProcedure } from '../trpc';
import {
  listOriginsByAddress,
  listOriginsWithResources,
  listOriginsWithResourcesByAddress,
  searchOrigins,
  searchOriginsSchema,
} from '@/services/db/origin';

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
  },
  search: publicProcedure
    .input(searchOriginsSchema)
    .query(async ({ input }) => {
      return await searchOrigins(input);
    }),
});
