import {
  listTopFacilitators,
  listTopFacilitatorsInputSchema,
} from '@/services/transfers/facilitators/list';
import {
  listTopFacilitatorsMV,
  listTopFacilitatorsMvInputSchema,
} from '@/services/transfers/facilitators/list-mv';
import {
  createTRPCRouter,
  paginatedProcedure,
  publicProcedure,
} from '../../trpc';
import {
  bucketedStatisticsInputSchema,
  getBucketedFacilitatorsStatistics,
} from '@/services/transfers/facilitators/bucketed';
import {
  bucketedFacilitatorsStatisticsMvInputSchema,
  getBucketedFacilitatorsStatisticsMV,
} from '@/services/transfers/facilitators/bucketed-mv';

export const facilitatorsRouter = createTRPCRouter({
  list: paginatedProcedure
    .input(listTopFacilitatorsInputSchema)
    .query(async ({ input, ctx: { pagination } }) => {
      return await listTopFacilitators(input, pagination);
    }),

  listMv: paginatedProcedure
    .input(listTopFacilitatorsMvInputSchema)
    .query(async ({ input, ctx: { pagination } }) => {
      return await listTopFacilitatorsMV(input, pagination);
    }),

  bucketedStatistics: publicProcedure
    .input(bucketedStatisticsInputSchema)
    .query(async ({ input }) => {
      return await getBucketedFacilitatorsStatistics(input);
    }),

  bucketedStatisticsMv: publicProcedure
    .input(bucketedFacilitatorsStatisticsMvInputSchema)
    .query(async ({ input }) => {
      return await getBucketedFacilitatorsStatisticsMV(input);
    }),
});
