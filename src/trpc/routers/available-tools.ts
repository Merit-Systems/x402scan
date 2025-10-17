import { searchResourcesSchema } from '@/services/db/resources';
import { publicProcedure, createTRPCRouter } from '../trpc';
import { searchX402Tools } from '@/services/agent/search-tools';

export const availableToolsRouter = createTRPCRouter({
  search: publicProcedure
    .input(searchResourcesSchema)
    .query(async ({ input }) => {
      return await searchX402Tools(input);
    }),
});
