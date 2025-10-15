import {
  getOverallStatistics,
  overallStatisticsInputSchema,
} from '@/services/indexer/stats/overall';
import {
  getBucketedStatistics,
  bucketedStatisticsInputSchema,
} from '@/services/indexer/stats/bucketed';
import {
  getFirstTransferTimestampInputSchema,
  getFirstTransferTimestamp,
} from '@/services/indexer/stats/first-transfer';

import { createTRPCRouter, publicProcedure } from '../trpc';
import { getAcceptsAddresses } from '@/services/db/accepts';

export const statisticsRouter = createTRPCRouter({
  getOverallStatistics: publicProcedure
    .input(overallStatisticsInputSchema)
    .query(async ({ input }) => {
      return await getOverallStatistics(input);
    }),
  getBucketedStatistics: publicProcedure
    .input(bucketedStatisticsInputSchema)
    .query(async ({ input }) => {
      return await getBucketedStatistics(input);
    }),

  getFirstTransferTimestamp: publicProcedure
    .input(getFirstTransferTimestampInputSchema)
    .query(async ({ input }) => {
      return await getFirstTransferTimestamp(input);
    }),

  bazaar: {
    overallStatistics: publicProcedure
      .input(overallStatisticsInputSchema)
      .query(async ({ input }) => {
        const originsByAddress = await getAcceptsAddresses();
        return await getOverallStatistics({
          ...input,
          addresses: Object.keys(originsByAddress),
        });
      }),
    bucketedStatistics: publicProcedure
      .input(bucketedStatisticsInputSchema)
      .query(async ({ input }) => {
        const originsByAddress = await getAcceptsAddresses();
        return await getBucketedStatistics({
          ...input,
          addresses: Object.keys(originsByAddress),
        });
      }),
  },
});
