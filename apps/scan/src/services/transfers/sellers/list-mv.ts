import z from "zod";
import { Prisma } from "@x402scan/transfers-db";

import { chainSchema, mixedAddressSchema } from "@/lib/schemas";
import { toPaginatedResponse } from "@/lib/pagination";

import { baseListQuerySchema } from "../schemas";
import {
  createCachedPaginatedQuery,
  createStandardCacheKey,
} from "@/lib/cache";
import { queryRaw } from "@/services/transfers/client";
import { getMaterializedViewSuffix } from "@/lib/time-range";
import { buildSellersOrderByColumn } from "./order-by";
import {
  DEFAULT_SELLERS_SORTING,
  SELLERS_SORT_IDS,
} from "@/lib/table-sort-options";

import type { paginatedQuerySchema } from "@/lib/pagination";

export const listTopSellersMVInputSchema = baseListQuerySchema({
  sortIds: SELLERS_SORT_IDS,
  defaultSortId: DEFAULT_SELLERS_SORTING.id,
});

// Exported for use in listBazaarOrigins to avoid double-caching
export const listTopSellersMVUncached = async (
  input: z.infer<typeof listTopSellersMVInputSchema>,
  pagination: z.infer<typeof paginatedQuerySchema>
) => {
  const { sorting, timeframe } = input;

  const mvTimeframe = getMaterializedViewSuffix(timeframe);
  const tableName = `recipient_stats_aggregated_${mvTimeframe}`;

  // Build WHERE clause for materialized view
  const conditions: Prisma.Sql[] = [Prisma.sql`WHERE 1=1`];

  if (input.facilitatorIds && input.facilitatorIds.length > 0) {
    conditions.push(
      Prisma.sql`AND ${input.facilitatorIds}::text[] && facilitator_ids`
    );
  }

  if (input.chain) {
    conditions.push(Prisma.sql`AND chain = ${input.chain}`);
  }

  if (input.recipients?.include && input.recipients.include.length > 0) {
    conditions.push(
      Prisma.sql`AND recipient = ANY(${input.recipients.include})`
    );
  }

  if (input.recipients?.exclude && input.recipients.exclude.length > 0) {
    conditions.push(
      Prisma.sql`AND NOT (recipient = ANY(${input.recipients.exclude}))`
    );
  }

  const whereClause = Prisma.join(conditions, " ");

  const t0 = performance.now();
  const offset = pagination.page * pagination.page_size;

  const orderByClause = Prisma.sql`ORDER BY ${Prisma.raw(
    buildSellersOrderByColumn(sorting)
  )}`;

  // Each MV row is already aggregated per (recipient, chain), so grouping by
  // recipient (to fold multiple chains into one) and SUM-ing is correct on its
  // own. facilitator_ids must be flattened in a per-recipient outer subquery —
  // a `LATERAL unnest(facilitator_ids)` in the FROM clause fans each row out
  // once per facilitator and multiplies tx_count/total_amount/unique_buyers by
  // the facilitator count. Mirrors the buyers query in ../buyers/list-mv.ts.
  const items = await queryRaw(
    Prisma.sql`
    WITH paginated AS (
      SELECT
        recipient,
        COALESCE(SUM(total_transactions), 0)::integer as tx_count,
        COALESCE(SUM(total_amount), 0)::float as total_amount,
        MAX(latest_block_timestamp) as latest_block_timestamp,
        COALESCE(SUM(unique_buyers), 0)::integer as unique_buyers,
        COALESCE(ARRAY_AGG(DISTINCT chain) FILTER (WHERE chain IS NOT NULL), ARRAY[]::text[]) as chains
      FROM ${Prisma.raw(tableName)}
      ${whereClause}
      GROUP BY recipient
      ${orderByClause}
      LIMIT ${pagination.page_size}
      OFFSET ${offset}
    )
    SELECT
      p.recipient,
      COALESCE(
        (SELECT ARRAY_AGG(DISTINCT f) FILTER (WHERE f IS NOT NULL)
         FROM ${Prisma.raw(tableName)} mv, LATERAL unnest(mv.facilitator_ids) AS f
         WHERE mv.recipient = p.recipient
           ${input.chain ? Prisma.sql`AND mv.chain = ${input.chain}` : Prisma.empty}),
        ARRAY[]::text[]
      ) as facilitator_ids,
      p.tx_count,
      p.total_amount,
      p.latest_block_timestamp,
      p.unique_buyers,
      p.chains
    FROM paginated p
    ${orderByClause}`,
    z.array(
      z.object({
        recipient: mixedAddressSchema,
        facilitator_ids: z.array(z.string()),
        tx_count: z.number(),
        total_amount: z.number(),
        latest_block_timestamp: z.date().nullable(),
        unique_buyers: z.number(),
        chains: z.array(chainSchema),
      })
    )
  );

  console.log(
    `[sellers-mv] main query ${tableName} ${(performance.now() - t0).toFixed(0)}ms (${String(items.length)} rows)`
  );

  let count: number;

  if (items.length < pagination.page_size) {
    count = offset + items.length;
  } else {
    const countResult = await queryRaw(
      Prisma.sql`
        SELECT COUNT(DISTINCT recipient)::integer AS count
        FROM ${Prisma.raw(tableName)}
        ${whereClause}
      `,
      z.array(
        z.object({
          count: z.number(),
        })
      )
    );
    count = countResult[0]?.count ?? 0;
    console.log(
      `[sellers-mv] count query ${tableName} ${(performance.now() - t0).toFixed(0)}ms`
    );
  }

  return toPaginatedResponse({
    items,
    total_count: count,
    ...pagination,
  });
};

export const listTopSellersMV = createCachedPaginatedQuery({
  queryFn: listTopSellersMVUncached,
  cacheKeyPrefix: "sellers-list-mv",
  createCacheKey: createStandardCacheKey,
  dateFields: ["latest_block_timestamp"],
  tags: ["sellers"],
});
