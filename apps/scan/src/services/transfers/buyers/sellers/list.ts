import z from "zod";
import { Prisma } from "@x402scan/transfers-db";

import { chainSchema, mixedAddressSchema } from "@/lib/schemas";
import { toPaginatedResponse } from "@/lib/pagination";

import { baseListQuerySchema } from "../../schemas";
import {
  createCachedPaginatedQuery,
  createStandardCacheKey,
} from "@/lib/cache";
import { queryRaw } from "@/services/transfers/client";
import { getTimeRangeFromTimeframe } from "@/lib/time-range";
import {
  BUYER_SELLERS_SORT_IDS,
  DEFAULT_BUYER_SELLERS_SORTING,
} from "@/lib/table-sort-options";

import type { paginatedQuerySchema } from "@/lib/pagination";

export const listBuyerSellersInputSchema = baseListQuerySchema({
  sortIds: BUYER_SELLERS_SORT_IDS,
  defaultSortId: DEFAULT_BUYER_SELLERS_SORTING.id,
}).extend({
  sender: mixedAddressSchema,
});

const listBuyerSellersUncached = async (
  input: z.infer<typeof listBuyerSellersInputSchema>,
  pagination: z.infer<typeof paginatedQuerySchema>
) => {
  const { sorting, sender, timeframe } = input;
  const { startDate, endDate } = getTimeRangeFromTimeframe(timeframe);

  // Build WHERE conditions
  const conditions: Prisma.Sql[] = [Prisma.sql`WHERE t.sender = ${sender}`];

  if (startDate) {
    conditions.push(
      Prisma.sql`AND t.block_timestamp >= ${startDate.toISOString()}::timestamp`
    );
  }
  if (endDate) {
    conditions.push(
      Prisma.sql`AND t.block_timestamp <= ${endDate.toISOString()}::timestamp`
    );
  }
  if (input.chain) {
    conditions.push(Prisma.sql`AND t.chain = ${input.chain}`);
  }

  const whereClause = Prisma.join(conditions, " ");
  const offset = pagination.page * pagination.page_size;

  const items = await queryRaw(
    Prisma.sql`
    SELECT
      t.recipient,
      COUNT(*)::integer AS tx_count,
      COALESCE(SUM(t.amount), 0)::float AS total_amount,
      MAX(t.block_timestamp) AS latest_block_timestamp,
      COALESCE(ARRAY_AGG(DISTINCT t.chain) FILTER (WHERE t.chain IS NOT NULL), ARRAY[]::text[]) AS chains,
      COALESCE(ARRAY_AGG(DISTINCT t.facilitator_id) FILTER (WHERE t.facilitator_id IS NOT NULL), ARRAY[]::text[]) AS facilitator_ids
    FROM "TransferEvent" t
    ${whereClause}
    GROUP BY t.recipient
    ORDER BY ${Prisma.raw(`"${sorting.id}"`)} ${sorting.desc ? Prisma.raw("DESC") : Prisma.raw("ASC")}
    LIMIT ${pagination.page_size}
    OFFSET ${offset}`,
    z.array(
      z.object({
        recipient: mixedAddressSchema,
        tx_count: z.number(),
        total_amount: z.number(),
        latest_block_timestamp: z.date().nullable(),
        chains: z.array(chainSchema),
        facilitator_ids: z.array(z.string()),
      })
    )
  );

  let count: number;

  if (items.length < pagination.page_size) {
    count = offset + items.length;
  } else {
    const countResult = await queryRaw(
      Prisma.sql`
        SELECT COUNT(DISTINCT t.recipient)::integer AS count
        FROM "TransferEvent" t
        ${whereClause}
      `,
      z.array(
        z.object({
          count: z.number(),
        })
      )
    );
    count = countResult[0]?.count ?? 0;
  }

  return toPaginatedResponse({
    items,
    total_count: count,
    ...pagination,
  });
};

export const listBuyerSellers = createCachedPaginatedQuery({
  queryFn: listBuyerSellersUncached,
  cacheKeyPrefix: "buyer-sellers-list",
  createCacheKey: createStandardCacheKey,
  dateFields: ["latest_block_timestamp"],
  tags: ["buyers", "sellers"],
});
