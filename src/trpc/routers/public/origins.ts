import { createTRPCRouter, publicProcedure } from '../../trpc';
import {
  listOrigins,
  listOriginsSchema,
  listOriginsWithResources,
  listOriginsWithResourcesSchema,
  searchOrigins,
  searchOriginsSchema,
} from '@/services/db/resources/origin';

export const originsRouter = createTRPCRouter({
  list: {
    origins: publicProcedure
      .input(listOriginsSchema)
      .query(async ({ input }) => {
        return await listOrigins(input);
      }),

    withResources: publicProcedure
      .input(listOriginsWithResourcesSchema)
      .query(async ({ input }) => {
        return await listOriginsWithResources(input);
      }),
  },
  search: publicProcedure
    .input(searchOriginsSchema)
    .query(async ({ input }) => {
      return await searchOrigins(input);
    }),
});
