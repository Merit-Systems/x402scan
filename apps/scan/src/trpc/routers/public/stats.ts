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
    .query(async ({ input, ctx }) => {
      return await getOverallStatistics(input, ctx);
    }),
  bucketed: publicProcedure
    .input(bucketedStatisticsInputSchema)
    .query(async ({ input, ctx }) => {
      return await getBucketedStatistics(input, ctx);
    }),

  firstTransferTimestamp: publicProcedure
    .input(getFirstTransferTimestampInputSchema)
    .query(async ({ input }) => {
      return await getFirstTransferTimestamp(input);
    }),

  bazaar: {
    overall: publicProcedure
      .input(overallStatisticsInputSchema)
      .query(async ({ input, ctx }) => {
        const originsByAddress = await getAcceptsAddresses({
          chain: input.chain,
        });
        return await getOverallStatistics(
          {
            ...input,
            recipients: {
              include: Object.keys(originsByAddress).map(addr =>
                mixedAddressSchema.parse(addr)
              ),
            },
          },
          ctx
        );
      }),
    bucketed: publicProcedure
      .input(bucketedStatisticsInputSchema)
      .query(async ({ input, ctx }) => {
        const originsByAddress = await getAcceptsAddresses({
          chain: input.chain,
        });
        return await getBucketedStatistics(
          {
            ...input,
            recipients: {
              include: Object.keys(originsByAddress).map(addr =>
                mixedAddressSchema.parse(addr)
              ),
            },
          },
          ctx
        );
      }),
  },
});
