import { createTRPCRouter, publicProcedure } from "../../trpc";

import {
  listBazaarOrigins,
  listBazaarOriginSummaries,
} from "@/services/db/bazaar/origins";
import {
  listBazaarOriginsInputSchema,
  listFeaturedBazaarOriginsInputSchema,
} from "@/services/db/bazaar/schema";
import { getDiscoverOrigins } from "@/lib/discover/origins";
import { paginatedQuerySchema } from "@/lib/pagination";

const paginationSchema = paginatedQuerySchema.default({
  page: 0,
  page_size: 100,
});
const listBazaarOriginsQuerySchema = listBazaarOriginsInputSchema.extend({
  pagination: paginationSchema,
});
const listFeaturedBazaarOriginsQuerySchema =
  listFeaturedBazaarOriginsInputSchema.extend({
    pagination: paginationSchema,
  });

export const sellersRouter = createTRPCRouter({
  bazaar: {
    featuredSummaries: publicProcedure
      .input(listFeaturedBazaarOriginsQuerySchema)
      .query(async ({ input }) => {
        const { pagination, ...query } = input;
        const originUrls = await getDiscoverOrigins();
        return listBazaarOriginSummaries({ ...query, originUrls }, pagination);
      }),
    summaries: publicProcedure
      .input(listBazaarOriginsQuerySchema)
      .query(async ({ input }) => {
        const { pagination, ...query } = input;
        return listBazaarOriginSummaries(query, pagination);
      }),
    list: publicProcedure
      .input(listBazaarOriginsQuerySchema)
      .query(async ({ input }) => {
        const { pagination, ...query } = input;
        return listBazaarOrigins(query, pagination);
      }),
    featured: publicProcedure
      .input(listFeaturedBazaarOriginsQuerySchema)
      .query(async ({ input }) => {
        const { pagination, ...query } = input;
        const originUrls = await getDiscoverOrigins();
        return listBazaarOrigins({ ...query, originUrls }, pagination);
      }),
  },
});
