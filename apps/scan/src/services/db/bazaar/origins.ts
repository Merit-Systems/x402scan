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
  // When verifiedOnly is true, only get verified addresses
  // This filters at the Accepts level before querying TransferEvents
  const { addressToOrigins, originVerification } = await getAcceptsAddresses({
    chain: input.chain,
    tags: input.tags,
    verified: input.verifiedOnly ? true : undefined,
  });

  // Use the standard materialized view query
  // When verifiedOnly is true, we already filtered to only verified addresses above
  const result = await listTopSellersMVUncached(
    {
      ...input,
      recipients: {
        include: Object.keys(addressToOrigins).map(addr =>
          mixedAddressSchema.parse(addr)
        ),
      },
    },
    pagination
  );

  // Group by origin
  const originMap = new Map<
    string,
    {
      originId: string;
      origins: (typeof addressToOrigins)[string];
      recipients: MixedAddress[];
      facilitators: string[];
      tx_count: number;
      total_amount: number;
      latest_block_timestamp: Date | null;
      unique_buyers: number;
      chains: Set<Chain>;
      hasVerifiedAccept: boolean;
    }
  >();

  for (const item of result.items) {
    const origins = addressToOrigins[item.recipient];
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
        hasVerifiedAccept: originVerification.get(originId) ?? false,
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
    hasVerifiedAccept: item.hasVerifiedAccept,
  }));

  return toPaginatedResponse({
    items: groupedItems,
    total_count: Object.keys(addressToOrigins).length,
    ...pagination,
  });
};

export const listBazaarOrigins = createCachedPaginatedQuery({
  queryFn: listBazaarOriginsUncached,
  cacheKeyPrefix: 'bazaar:origins',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['latest_block_timestamp'],
  tags: ['bazaar', 'origins'],
});
