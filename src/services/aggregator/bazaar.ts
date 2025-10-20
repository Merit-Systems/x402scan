import type { Address } from 'viem';
import type { FacilitatorAddress } from '@/lib/facilitators';
import { getAcceptsAddressesWithOgImages } from '@/services/db/accepts';
import {
  listTopSellers,
  listTopSellersInputSchema,
} from '@/services/cdp/sql/sellers/list';
import type { infiniteQuerySchema } from '@/lib/pagination';
import z from 'zod';

export const listBazaarSellersInputSchema = listTopSellersInputSchema.extend({
  hasOgImage: z.boolean().optional(),
});

export async function listBazaarSellers(
  input: z.input<typeof listBazaarSellersInputSchema>,
  pagination: z.infer<ReturnType<typeof infiniteQuerySchema<bigint>>>
) {
  const originsByAddress = await getAcceptsAddressesWithOgImages();

  const result = await listTopSellers(
    {
      ...input,
      addresses: Object.keys(originsByAddress),
    },
    pagination
  );

  // Group by origin
  const originMap = new Map<
    string,
    {
      originId: string;
      origins: (typeof originsByAddress)[string];
      recipients: Address[];
      facilitators: FacilitatorAddress[];
      tx_count: number;
      total_amount: number;
      latest_block_timestamp: Date;
      unique_buyers: number;
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
      for (const facilitator of item.facilitators) {
        if (!existing.facilitators.includes(facilitator)) {
          existing.facilitators.push(facilitator);
        }
      }
    } else {
      originMap.set(originId, {
        originId,
        origins,
        recipients: [item.recipient],
        facilitators: [...item.facilitators],
        tx_count: item.tx_count,
        total_amount: item.total_amount,
        latest_block_timestamp: item.latest_block_timestamp,
        unique_buyers: item.unique_buyers,
      });
    }
  }

  // Convert map to array
  let groupedItems = Array.from(originMap.values()).map(item => ({
    recipients: item.recipients,
    origins: item.origins,
    facilitators: item.facilitators,
    tx_count: item.tx_count,
    total_amount: item.total_amount,
    latest_block_timestamp: item.latest_block_timestamp,
    unique_buyers: item.unique_buyers,
  }));

  // Filter by OG image if requested
  if (input.hasOgImage !== undefined) {
    groupedItems = groupedItems.filter(item => {
      const hasOgImage = item.origins.some(
        origin => origin.ogImages.length > 0
      );
      return input.hasOgImage ? hasOgImage : !hasOgImage;
    });
  }

  return {
    items: groupedItems,
    hasNextPage: result.hasNextPage,
  };
}
