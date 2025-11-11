import {
  listTopFacilitators,
  listTopFacilitatorsInputSchema,
} from '@/services/transfers/facilitators/list';
import {
  createTRPCRouter,
  paginatedProcedure,
  publicProcedure,
} from '../../trpc';
import {
  bucketedFacilitatorsStatisticsInputSchema,
  getBucketedFacilitatorsStatistics,
} from '@/services/transfers/facilitators/bucketed';

export const facilitatorsRouter = createTRPCRouter({
  list: paginatedProcedure
    .input(listTopFacilitatorsInputSchema)
    .query(async ({ input, ctx: { pagination } }) => {
      return await listTopFacilitators(input, pagination);
    }),

  bucketedStatistics: publicProcedure
    .input(bucketedFacilitatorsStatisticsInputSchema)
    .query(async ({ input }) => {
      return await getBucketedFacilitatorsStatistics(input);
    }),
});
