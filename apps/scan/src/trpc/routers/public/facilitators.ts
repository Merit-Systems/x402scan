import {
  bucketedStatisticsInputSchema,
  getBucketedFacilitatorsStatistics,
} from "@/services/transfers/facilitators/bucketed";
import {
  listTopFacilitators,
  listTopFacilitatorsInputSchema,
} from "@/services/transfers/facilitators/list";

import {
  createTRPCRouter,
  paginatedProcedure,
  publicProcedure,
} from "../../trpc";

export const facilitatorsRouter = createTRPCRouter({
  list: paginatedProcedure
    .input(listTopFacilitatorsInputSchema)
    .query(async ({ input, ctx: { pagination } }) => {
      return listTopFacilitators(input, pagination);
    }),

  bucketedStatistics: publicProcedure
    .input(bucketedStatisticsInputSchema)
    .query(async ({ input }) => {
      return getBucketedFacilitatorsStatistics(input);
    }),
});
