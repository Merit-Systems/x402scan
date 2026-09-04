import type z from "zod";

import {
  toPeekAheadResponse,
  type paginatedQuerySchema,
} from "@/lib/pagination";
import { baseListQuerySchema } from "../schemas";
import {
  createCachedPaginatedQuery,
  createStandardCacheKey,
} from "@/lib/cache";
import { transfersDb } from "@x402scan/transfers-db";
import { chainSchema, mixedAddressSchema } from "@/lib/schemas";
import { transfersWhereObject } from "../query-utils";
import {
  DEFAULT_TRANSFERS_SORTING,
  TRANSFERS_SORT_IDS,
} from "@/lib/table-sort-options";

export const listFacilitatorTransfersInputSchema = baseListQuerySchema({
  sortIds: TRANSFERS_SORT_IDS,
  defaultSortId: DEFAULT_TRANSFERS_SORTING.id,
});

const listFacilitatorTransfersUncached = async (
  input: z.infer<typeof listFacilitatorTransfersInputSchema>,
  pagination: z.infer<typeof paginatedQuerySchema>
) => {
  const { sorting } = input;
  const { page_size, page } = pagination;

  const where = transfersWhereObject(input);
  const transfers = await transfersDb.transferEvent.findMany({
    where,
    orderBy: {
      [sorting.id]: sorting.desc ? "desc" : "asc",
    },
    take: page_size + 1,
    skip: page * page_size,
  });

  // Map to expected output format
  const items = transfers.map((transfer) => ({
    ...transfer,
    sender: mixedAddressSchema.parse(transfer.sender),
    recipient: mixedAddressSchema.parse(transfer.recipient),
    token_address: mixedAddressSchema.parse(transfer.address),
    transaction_from: mixedAddressSchema.parse(transfer.transaction_from),
    chain: chainSchema.parse(transfer.chain),
  }));

  return toPeekAheadResponse({
    items,
    ...pagination,
  });
};

export const listFacilitatorTransfers = createCachedPaginatedQuery({
  queryFn: listFacilitatorTransfersUncached,
  cacheKeyPrefix: "transfers-list",
  createCacheKey: (input) => createStandardCacheKey(input),
  dateFields: ["block_timestamp"],
  tags: ["transfers"],
});
