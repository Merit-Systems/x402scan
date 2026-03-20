import { listTopSellersMVUncached } from '@/services/transfers/sellers/list-mv';
import { getAcceptsAddresses } from '../resources/accepts';
import { mixedAddressSchema } from '@/lib/schemas';

import type z from 'zod';
import {
  toPaginatedResponse,
  type paginatedQuerySchema,
} from '@/lib/pagination';
import type { MixedAddress } from '@/types/address';
import type { Chain } from '@/types/chain';
import type { listBazaarOriginsInputSchema } from './schema';
import {
  createCachedPaginatedQuery,
  createStandardCacheKey,
} from '@/lib/cache';

const listBazaarOriginsUncached = async (
  input: z.infer<typeof listBazaarOriginsInputSchema>,
  pagination: z.infer<typeof paginatedQuerySchema>
) => {
  const t0 = performance.now();

  let originsByAddress: Awaited<ReturnType<typeof getAcceptsAddresses>>;
  try {
    originsByAddress = await getAcceptsAddresses({
      chain: input.chain,
      tags: input.tags,
    });
  } catch (err) {
    console.error(
      `[bazaar.list] getAcceptsAddresses FAILED after ${(performance.now() - t0).toFixed(0)}ms:`,
      err
    );
    throw err;
  }

  const tAccepts = performance.now();

  if (!input.showGamed) {
    for (const addr of Object.keys(originsByAddress)) {
      const origins = originsByAddress[addr]!.filter(o => !o.isGamed);
      if (origins.length === 0) {
        delete originsByAddress[addr];
      } else {
        originsByAddress[addr] = origins;
      }
    }
  }

  const addrCount = Object.keys(originsByAddress).length;
  console.log(
    `[bazaar.list] accepts=${(tAccepts - t0).toFixed(0)}ms (${addrCount} addrs)`
  );

  const result = await listTopSellersMVUncached(
    {
      ...input,
      recipients: {
        include: Object.keys(originsByAddress).map(addr =>
          mixedAddressSchema.parse(addr)
        ),
      },
    },
    pagination
  );

  const tMV = performance.now();

  console.log(
    `[bazaar.list] mv=${(tMV - tAccepts).toFixed(0)}ms (${result.items.length} items)` +
      ` chain=${input.chain ?? 'all'} timeframe=${typeof input.timeframe === 'number' ? input.timeframe : input.timeframe.period}`
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
        recipients: [item.recipient as MixedAddress],
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
  const groupedItems = Array.from(originMap.values()).map(item => ({
    recipients: item.recipients,
    origins: item.origins,
    facilitators: item.facilitators,
    tx_count: item.tx_count,
    total_amount: item.total_amount,
    latest_block_timestamp: item.latest_block_timestamp,
    unique_buyers: item.unique_buyers,
    chains: Array.from(item.chains),
  }));

  const response = toPaginatedResponse({
    items: groupedItems,
    total_count: Object.keys(originsByAddress).length,
    ...pagination,
  });

  console.log(
    `[bazaar.list] total=${(performance.now() - t0).toFixed(0)}ms` +
      ` grouped=${groupedItems.length} origins`
  );

  return response;
};

export const listBazaarOrigins = createCachedPaginatedQuery({
  queryFn: listBazaarOriginsUncached,
  cacheKeyPrefix: 'bazaar:origins',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['latest_block_timestamp'],
  tags: ['bazaar', 'origins'],
});
