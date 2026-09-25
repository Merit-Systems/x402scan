import { listTopSellersMVUncached } from "@/services/transfers/sellers/list-mv";
import { getAcceptsAddresses } from "../resources/accepts";
import { mixedAddressSchema } from "@/lib/schemas";
import { createCachedArrayQuery, createStandardCacheKey } from "@/lib/cache";

import type z from "zod";
import {
  toPaginatedResponse,
  type paginatedQuerySchema,
} from "@/lib/pagination";
import type { MixedAddress } from "@/types/address";
import type { Chain } from "@/types/chain";
import { listBazaarOriginsInputSchema } from "./schema";

const listBazaarOriginsUncached = async (
  input: z.infer<typeof listBazaarOriginsInputSchema>
) => {
  const t0 = performance.now();

  let originsByAddress: Awaited<ReturnType<typeof getAcceptsAddresses>>;
  try {
    originsByAddress = await getAcceptsAddresses({
      chain: input.chain,
      tags: input.tags,
      originUrls: input.originUrls,
    });
  } catch (err) {
    console.error(
      `[bazaar.list] getAcceptsAddresses FAILED after ${(performance.now() - t0).toFixed(0)}ms:`,
      err
    );
    throw err;
  }

  const tAccepts = performance.now();
  const addresses = Object.keys(originsByAddress);
  const addrCount = addresses.length;
  console.log(
    `[bazaar.list] accepts=${(tAccepts - t0).toFixed(0)}ms (${addrCount} addrs)`
  );

  const result = await listTopSellersMVUncached(
    {
      ...input,
      recipients: {
        include: addresses.map((address) => mixedAddressSchema.parse(address)),
      },
    },
    {
      page: 0,
      page_size: addrCount,
    }
  );

  const tMV = performance.now();

  console.log(
    `[bazaar.list] mv=${(tMV - tAccepts).toFixed(0)}ms (${result.items.length} items)` +
      ` chain=${input.chain ?? "all"} timeframe=${input.timeframe instanceof Object ? input.timeframe.period : input.timeframe}`
  );

  // Group by origin
  const originMap = new Map<
    string,
    {
      originId: string;
      origins: (typeof originsByAddress)[string];
      recipients: MixedAddress[];
      facilitators: string[];
      tx_count: number;
      total_amount: number;
      latest_block_timestamp: Date | null;
      unique_buyers: number;
      chains: Set<Chain>;
    }
  >();

  for (const item of result.items) {
    const origins = originsByAddress[item.recipient];
    if (!origins || origins.length === 0) continue;

    // Use the first origin's ID as the grouping key
    const originId = origins[0]!.id;

    const existing = originMap.get(originId);
    if (existing) {
      // Aggregate stats
      existing.recipients.push(item.recipient);
      existing.tx_count += item.tx_count;
      existing.total_amount += item.total_amount;
      existing.unique_buyers += item.unique_buyers;
      // Keep the latest timestamp
      if (
        item.latest_block_timestamp &&
        (!existing.latest_block_timestamp ||
          item.latest_block_timestamp > existing.latest_block_timestamp)
      ) {
        existing.latest_block_timestamp = item.latest_block_timestamp;
      }
      // Merge facilitators (deduplicated)
      for (const facilitator of item.facilitator_ids) {
        if (!existing.facilitators.includes(facilitator)) {
          existing.facilitators.push(facilitator);
        }
      }
      // Merge chains (deduplicated)
      for (const chain of item.chains) {
        existing.chains.add(chain);
      }
    } else {
      originMap.set(originId, {
        originId,
        origins,
        recipients: [item.recipient],
        facilitators: [...item.facilitator_ids],
        tx_count: item.tx_count,
        total_amount: item.total_amount,
        latest_block_timestamp: item.latest_block_timestamp,
        unique_buyers: item.unique_buyers,
        chains: new Set(item.chains),
      });
    }
  }

  // Convert map to array
  const groupedItems = Array.from(originMap.values()).map((item) => ({
    recipients: item.recipients,
    origins: item.origins,
    facilitators: item.facilitators,
    tx_count: item.tx_count,
    total_amount: item.total_amount,
    latest_block_timestamp: item.latest_block_timestamp,
    unique_buyers: item.unique_buyers,
    chains: Array.from(item.chains),
  }));

  // Re-sort after grouping. The MV sorts per-recipient, but aggregation
  // changes the totals so we need to re-sort the grouped results.
  const sortableNumericKeys = [
    "tx_count",
    "total_amount",
    "unique_buyers",
  ] as const;
  type SortableNumericKey = (typeof sortableNumericKeys)[number];

  const direction = input.sorting.desc ? -1 : 1;

  if (input.sorting.id === "editorial" && input.originUrls) {
    const editorialIndex = new Map(
      input.originUrls.map((url, index) => [url, index])
    );
    const fallback = editorialIndex.size;
    groupedItems.sort((a, b) => {
      const aRank = editorialIndex.get(a.origins[0]?.origin ?? "") ?? fallback;
      const bRank = editorialIndex.get(b.origins[0]?.origin ?? "") ?? fallback;
      return (aRank - bRank) * direction;
    });
  } else if (input.sorting.id === "latest_block_timestamp") {
    groupedItems.sort((a, b) => {
      const aTime = a.latest_block_timestamp?.getTime() ?? 0;
      const bTime = b.latest_block_timestamp?.getTime() ?? 0;
      return (aTime - bTime) * direction;
    });
  } else if (
    sortableNumericKeys.includes(input.sorting.id as SortableNumericKey)
  ) {
    const key = input.sorting.id as SortableNumericKey;
    groupedItems.sort((a, b) => (a[key] - b[key]) * direction);
  }

  console.log(
    `[bazaar.list] total=${(performance.now() - t0).toFixed(0)}ms` +
      ` grouped=${groupedItems.length} origins`
  );

  return groupedItems;
};

const listAllBazaarOrigins = createCachedArrayQuery({
  queryFn: listBazaarOriginsUncached,
  cacheKeyPrefix: "bazaar-origins",
  // createStandardCacheKey sorts arrays for normalization, so the cache key
  // is order-insensitive in `originUrls`. That's safe today because the only
  // producer (getDiscoverOrigins) returns a deterministic order. When sorting
  // is 'editorial' the OUTPUT order depends on the input array order — if a
  // future caller passes a differently-ordered originUrls expecting editorial
  // honor, they'd silently get the cached output ordered by the first caller.
  // If that ever becomes a real concern, switch this to a custom key fn that
  // skips sort-normalization for `originUrls` when sorting.id === 'editorial'.
  createCacheKey: createStandardCacheKey,
  dateFields: ["latest_block_timestamp"],
  tags: ["transfers"],
});

export const listBazaarOrigins = async (
  input: z.infer<typeof listBazaarOriginsInputSchema>,
  pagination: z.infer<typeof paginatedQuerySchema>
) => {
  // paginatedProcedure merges pagination into the runtime tRPC input. Parse
  // again at the service boundary so the complete grouped result has one
  // cache entry shared by every requested page.
  const queryInput = listBazaarOriginsInputSchema.parse(input);
  const groupedItems = await listAllBazaarOrigins(queryInput);
  const pageStart = pagination.page * pagination.page_size;

  return toPaginatedResponse({
    items: groupedItems.slice(pageStart),
    total_count: groupedItems.length,
    ...pagination,
  });
};
