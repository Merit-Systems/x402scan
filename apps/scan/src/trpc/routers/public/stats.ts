import {
  getFirstTransferTimestampInputSchema,
  getFirstTransferTimestamp,
} from '@/services/transfers/stats/first-transfer';

import { createTRPCRouter, publicProcedure } from '../../trpc';
import { getAcceptsAddresses } from '@/services/db/resources/accepts';
import { mixedAddressSchema } from '@/lib/schemas';
import {
  getOverallStatisticsMV,
  overallStatisticsMVInputSchema,
} from '@/services/transfers/stats/overall-mv';
import {
  getBucketedStatisticsMV,
  bucketedStatisticsMVInputSchema,
} from '@/services/transfers/stats/bucketed-mv';

export const statsRouter = createTRPCRouter({
  overall: publicProcedure
    .input(overallStatisticsMVInputSchema)
    .query(async ({ input, ctx }) => {
      return await getOverallStatisticsMV(input, ctx);
    }),
  bucketed: publicProcedure
    .input(bucketedStatisticsMVInputSchema)
    .query(async ({ input, ctx }) => {
      return await getBucketedStatisticsMV(input, ctx);
    }),
  firstTransferTimestamp: publicProcedure
    .input(getFirstTransferTimestampInputSchema)
    .query(async ({ input }) => {
      return await getFirstTransferTimestamp(input);
    }),

  bazaar: {
    overall: publicProcedure
      .input(overallStatisticsMVInputSchema)
      .query(async ({ input, ctx }) => {
        const originsByAddress = await getAcceptsAddresses({
          chain: input.chain,
        });
        return await getOverallStatisticsMV(
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
      .input(bucketedStatisticsMVInputSchema)
      .query(async ({ input, ctx }) => {
        const originsByAddress = await getAcceptsAddresses({
          chain: input.chain,
        });
        return await getBucketedStatisticsMV(
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
