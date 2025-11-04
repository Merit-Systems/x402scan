import {
  getOverallStatistics,
  overallStatisticsInputSchema,
} from '@/services/transfers/stats/overall';
import {
  getBucketedStatistics,
  bucketedStatisticsInputSchema,
} from '@/services/transfers/stats/bucketed';
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
  bucketed: publicProcedure
    .input(bucketedStatisticsInputSchema)
    .query(async ({ input }) => {
      return await getBucketedStatistics(input);
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
