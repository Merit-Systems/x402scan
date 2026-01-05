import {
  createTRPCRouter,
  paginatedProcedure,
  publicProcedure,
} from '../../trpc';
import {
  listTopSellersMV,
  listTopSellersMVInputSchema,
} from '@/services/transfers/sellers/list-mv';

import { listBazaarOrigins } from '@/services/db/bazaar/origins';
import { listBazaarOriginsInputSchema } from '@/services/db/bazaar/schema';
import { sellerStatisticsMVInputSchema } from '@/services/transfers/sellers/stats/overall-mv';
import { bucketedSellerStatisticsMVInputSchema } from '@/services/transfers/sellers/stats/bucketed-mv';
import { getAcceptsAddresses } from '@/services/db/resources/accepts';
import { mixedAddressSchema } from '@/lib/schemas';
import { getOverallSellerStatisticsMV } from '@/services/transfers/sellers/stats/overall-mv';
import { getBucketedSellerStatisticsMV } from '@/services/transfers/sellers/stats/bucketed-mv';

export const sellersRouter = createTRPCRouter({
  all: {
    list: paginatedProcedure
      .input(listTopSellersMVInputSchema)
      .query(async ({ input, ctx: { pagination } }) => {
        return await listTopSellersMV(input, pagination);
      }),
    stats: {
      overall: publicProcedure
        .input(sellerStatisticsMVInputSchema)
        .query(async ({ input }) => {
          return await getOverallSellerStatisticsMV(input);
        }),

      bucketed: publicProcedure
        .input(bucketedSellerStatisticsMVInputSchema)
        .query(async ({ input }) => {
          return await getBucketedSellerStatisticsMV(input);
        }),
    },
  },

  bazaar: {
    list: paginatedProcedure
      .input(listBazaarOriginsInputSchema)
      .query(async ({ input, ctx: { pagination } }) => {
        return await listBazaarOrigins(input, pagination);
      }),
    stats: {
      overall: publicProcedure
        .input(sellerStatisticsMVInputSchema)
        .query(async ({ input }) => {
          const originsByAddress = await getAcceptsAddresses({
            chain: input.chain,
          });
          return await getOverallSellerStatisticsMV({
            ...input,
            recipients: {
              include: Object.keys(originsByAddress)
                .map(addr => mixedAddressSchema.safeParse(addr))
                .filter(result => result.success)
                .map(result => result.data),
            },
          });
        }),

      bucketed: publicProcedure
        .input(bucketedSellerStatisticsMVInputSchema)
        .query(async ({ input }) => {
          const originsByAddress = await getAcceptsAddresses({
            chain: input.chain,
          });
          return await getBucketedSellerStatisticsMV({
            ...input,
            recipients: {
              include: Object.keys(originsByAddress)
                .map(addr => mixedAddressSchema.safeParse(addr))
                .filter(result => result.success)
                .map(result => result.data),
            },
          });
        }),
    },
  },
});
