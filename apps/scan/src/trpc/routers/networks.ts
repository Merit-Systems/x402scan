import {
  listTopNetworks,
  listTopNetworksInputSchema,
} from "@/services/transfers/networks/list";
import { createTRPCRouter, publicProcedure } from "../trpc";
import {
  bucketedNetworksStatisticsInputSchema,
  getBucketedNetworksStatistics,
} from "@/services/transfers/networks/bucketed";

export const networksRouter = createTRPCRouter({
  list: publicProcedure
    .input(listTopNetworksInputSchema)
    .query(async ({ input }) => {
      return listTopNetworks(input);
    }),

  bucketedStatistics: publicProcedure
    .input(bucketedNetworksStatisticsInputSchema)
    .query(async ({ input }) => {
      return getBucketedNetworksStatistics(input);
    }),
});
