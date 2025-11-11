import {
  listTopNetworks,
  listTopNetworksInputSchema,
} from '@/services/transfers/networks/list';
import {
  listTopNetworksMV,
  listTopNetworksMvInputSchema,
} from '@/services/transfers/networks/list-mv';
import { createTRPCRouter, publicProcedure } from '../trpc';
import {
  bucketedNetworksStatisticsInputSchema,
  getBucketedNetworksStatistics,
} from '@/services/transfers/networks/bucketed';
import {
  bucketedNetworksStatisticsMvInputSchema,
  getBucketedNetworksStatisticsMV,
} from '@/services/transfers/networks/bucketed-mv';

export const networksRouter = createTRPCRouter({
  list: publicProcedure
    .input(listTopNetworksInputSchema)
    .query(async ({ input }) => {
      return await listTopNetworks(input);
    }),

  listMv: publicProcedure
    .input(listTopNetworksMvInputSchema)
    .query(async ({ input }) => {
      return await listTopNetworksMV(input);
    }),

  bucketedStatistics: publicProcedure
    .input(bucketedNetworksStatisticsInputSchema)
    .query(async ({ input }) => {
      return await getBucketedNetworksStatistics(input);
    }),

  bucketedStatisticsMv: publicProcedure
    .input(bucketedNetworksStatisticsMvInputSchema)
    .query(async ({ input }) => {
      return await getBucketedNetworksStatisticsMV(input);
    }),
});
