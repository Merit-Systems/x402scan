import { cacheLife, cacheTag } from "next/cache";

import { transfersDb } from "@x402scan/transfers-db";

import { QUERY_CACHE_LIFE } from "@/lib/cache/constants";
import {
  toPeekAheadResponse,
  type paginatedQuerySchema,
} from "@/lib/pagination";
import { chainSchema, mixedAddressSchema } from "@/lib/schemas";
import {
  DEFAULT_TRANSFERS_SORTING,
  TRANSFERS_SORT_IDS,
} from "@/lib/table-sort-options";

import { transfersWhereObject } from "../query-utils";
import { baseListQuerySchema } from "../schemas";

import type z from "zod";

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

export const listFacilitatorTransfers = async (
  ...args: Parameters<typeof listFacilitatorTransfersUncached>
) => {
  "use cache: remote";
  cacheLife(QUERY_CACHE_LIFE);
  cacheTag("transfers");
  return listFacilitatorTransfersUncached(...args);
};
