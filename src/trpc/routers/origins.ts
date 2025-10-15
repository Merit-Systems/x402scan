import { ethereumAddressSchema } from '@/lib/schemas';
import { createTRPCRouter, publicProcedure } from '../trpc';
import {
  listOriginsByAddress,
  listOriginsWithResources,
  listOriginsWithResourcesByAddress,
  searchOrigins,
  searchOriginsSchema,
  getMostPopularOriginsAllTime,
  getMostPopularOriginsThisWeek,
  getNewestOrigins,
} from '@/services/db/origin';
import { z } from 'zod';

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
  
  featured: {
    mostPopularAllTime: publicProcedure
      .input(z.object({ limit: z.number().optional().default(6) }).optional())
      .query(async ({ input }) => {
        return await getMostPopularOriginsAllTime(input?.limit);
      }),
    
    mostPopularThisWeek: publicProcedure
      .input(z.object({ limit: z.number().optional().default(6) }).optional())
      .query(async ({ input }) => {
        return await getMostPopularOriginsThisWeek(input?.limit);
      }),
    
    newest: publicProcedure
      .input(z.object({ limit: z.number().optional().default(6) }).optional())
      .query(async ({ input }) => {
        return await getNewestOrigins(input?.limit);
      }),
  },
});
