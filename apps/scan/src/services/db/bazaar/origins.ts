import { listTopSellers } from '@/services/transfers/sellers/list';
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

export const listBazaarOrigins = async (
  input: z.infer<typeof listBazaarOriginsInputSchema>,
  pagination: z.infer<typeof paginatedQuerySchema>
) => {
  const originsByAddress = await getAcceptsAddresses({
    chain: input.chain,
    tags: input.tags,
  });

  const result = await listTopSellers(
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
      latest_block_timestamp: Date;
      unique_buyers: number;
      chains: Set<Chain>;
    }
  >();

  for (const item of result.items) {
    const origins = originsByAddress[item.recipient];
    if (!origins || origins.length === 0) continue;

    // Use the first origin's ID as the grouping key
    const originId = origins[0].id;

    const existing = originMap.get(originId);
    if (existing) {
      // Aggregate stats
      existing.recipients.push(item.recipient);
      existing.tx_count += item.tx_count;
      existing.total_amount += item.total_amount;
      existing.unique_buyers += item.unique_buyers;
      // Keep the latest timestamp
      if (item.latest_block_timestamp > existing.latest_block_timestamp) {
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

  return toPaginatedResponse({
    items: groupedItems,
    total_count: Object.keys(originsByAddress).length,
    ...pagination,
  });
};
