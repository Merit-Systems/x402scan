import z from 'zod';
import { createTRPCRouter, publicProcedure } from '../../trpc';
import { searchDiscover } from '@/lib/discover/search';

export const discoverRouter = createTRPCRouter({
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(500),
      })
    )
    .query(async ({ input }) => {
      return await searchDiscover(input.query);
    }),
});
