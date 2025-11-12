import {
  getOverallStatistics,
  overallStatisticsInputSchema,
} from '@/services/transfers/stats/overall';
import {
  getOverallStatisticsMV,
  overallStatisticsMvInputSchema,
} from '@/services/transfers/stats/overall-mv';
import {
  getBucketedStatistics,
  bucketedStatisticsInputSchema,
} from '@/services/transfers/stats/bucketed';
import {
  getBucketedStatisticsMV,
  bucketedStatisticsMvInputSchema,
} from '@/services/transfers/stats/bucketed-mv';
import {
  getFirstTransferTimestampInputSchema,
  getFirstTransferTimestamp,
} from '@/services/transfers/stats/first-transfer';

import { createTRPCRouter, publicProcedure } from '../../trpc';
import { getAcceptsAddresses } from '@/services/db/resources/accepts';
import { mixedAddressSchema } from '@/lib/schemas';

export const statsRouter = createTRPCRouter({
  overall: publicProcedure
    .input(overallStatisticsInputSchema)
    .query(async ({ input }) => {
      return await getOverallStatistics(input);
    }),
  overallMv: publicProcedure
    .input(overallStatisticsMvInputSchema)
    .query(async ({ input }) => {
      return await getOverallStatisticsMV(input);
    }),
  bucketed: publicProcedure
    .input(bucketedStatisticsInputSchema)
    .query(async ({ input }) => {
      return await getBucketedStatistics(input);
    }),
  bucketedMv: publicProcedure
    .input(bucketedStatisticsMvInputSchema)
    .query(async ({ input }) => {
      return await getBucketedStatisticsMV(input);
    }),

  firstTransferTimestamp: publicProcedure
    .input(getFirstTransferTimestampInputSchema)
    .query(async ({ input }) => {
      return await getFirstTransferTimestamp(input);
    }),

  bazaar: {
    overall: publicProcedure
      .input(overallStatisticsInputSchema)
      .query(async ({ input }) => {
        const originsByAddress = await getAcceptsAddresses({
          chain: input.chain,
        });
        return await getOverallStatistics({
          ...input,
          recipients: {
            include: Object.keys(originsByAddress).map(addr =>
              mixedAddressSchema.parse(addr)
            ),
          },
        });
      }),
    bucketed: publicProcedure
      .input(bucketedStatisticsInputSchema)
      .query(async ({ input }) => {
        const originsByAddress = await getAcceptsAddresses({
          chain: input.chain,
        });
        return await getBucketedStatistics({
          ...input,
          recipients: {
            include: Object.keys(originsByAddress).map(addr =>
              mixedAddressSchema.parse(addr)
            ),
          },
        });
      }),
  },
});
