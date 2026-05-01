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
import { getOverallSellerStatisticsMV } from '@/services/transfers/sellers/stats/overall-mv';
import { getBucketedSellerStatisticsMV } from '@/services/transfers/sellers/stats/bucketed-mv';
// Origin-based stats (pre-joined with payto_origin_map - no need to pass addresses)
import {
  getOverallOriginStatisticsMV,
  originStatisticsMVInputSchema,
} from '@/services/transfers/origins/stats/overall-mv';
import {
  getBucketedOriginStatisticsMV,
  bucketedOriginStatisticsMVInputSchema,
} from '@/services/transfers/origins/stats/bucketed-mv';

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
        .query(async ({ input, ctx }) => {
          return await getOverallSellerStatisticsMV(input, ctx);
        }),

      bucketed: publicProcedure
        .input(bucketedSellerStatisticsMVInputSchema)
        .query(async ({ input, ctx }) => {
          return await getBucketedSellerStatisticsMV(input, ctx);
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
      // Use origin_stats_aggregated_* views which are pre-joined with payto_origin_map
      // This eliminates the need to pass thousands of recipient addresses
      overall: publicProcedure
        .input(originStatisticsMVInputSchema)
        .query(async ({ input, ctx }) => {
          return await getOverallOriginStatisticsMV(input, ctx);
        }),

      bucketed: publicProcedure
        .input(bucketedOriginStatisticsMVInputSchema)
        .query(async ({ input, ctx }) => {
          return await getBucketedOriginStatisticsMV(input, ctx);
        }),
    },
  },
});
