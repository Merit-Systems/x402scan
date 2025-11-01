import {
  createTRPCRouter,
  paginatedProcedure,
  publicProcedure,
} from '../../trpc';
import {
  listTopSellers,
  listTopSellersInputSchema,
} from '@/services/transfers/sellers/list';

import { listBazaarOrigins } from '@/services/db/bazaar/origins';
import { listBazaarOriginsInputSchema } from '@/services/db/bazaar/schema';
import {
  getOverallSellerStatistics,
  sellerStatisticsInputSchema,
} from '@/services/transfers/sellers/stats/overall';
import {
  bucketedSellerStatisticsInputSchema,
  getBucketedSellerStatistics,
} from '@/services/transfers/sellers/stats/bucketed';
import { getAcceptsAddresses } from '@/services/db/resources/accepts';
import { mixedAddressSchema } from '@/lib/schemas';

export const sellersRouter = createTRPCRouter({
  all: {
    list: paginatedProcedure
      .input(listTopSellersInputSchema)
      .query(async ({ input, ctx: { pagination } }) => {
        return await listTopSellers(input, pagination);
      }),
    stats: {
      overall: publicProcedure
        .input(sellerStatisticsInputSchema)
        .query(async ({ input }) => {
          return await getOverallSellerStatistics(input);
        }),

      bucketed: publicProcedure
        .input(bucketedSellerStatisticsInputSchema)
        .query(async ({ input }) => {
          return await getBucketedSellerStatistics(input);
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
        .input(sellerStatisticsInputSchema)
        .query(async ({ input }) => {
          const originsByAddress = await getAcceptsAddresses({
            chain: input.chain,
          });
          return await getOverallSellerStatistics({
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
        .input(bucketedSellerStatisticsInputSchema)
        .query(async ({ input }) => {
          const originsByAddress = await getAcceptsAddresses({
            chain: input.chain,
          });
          return await getBucketedSellerStatistics({
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
