import type { Address } from 'viem';
import type { FacilitatorAddress } from '@/lib/facilitators';
import { listBazaarSellers, listBazaarSellersInputSchema } from './bazaar';
import { prisma } from '@/services/db/client';
import type { infiniteQuerySchema } from '@/lib/pagination';
import z from 'zod';

export const aggregateOriginsInputSchema = listBazaarSellersInputSchema.extend({
  aggregateBy: z
    .enum(['tx_count', 'total_amount', 'unique_buyers'])
    .default('tx_count'),
});

export async function aggregateOrigins(
  input: z.input<typeof aggregateOriginsInputSchema>,
  pagination: z.infer<ReturnType<typeof infiniteQuerySchema<bigint>>>
) {
  const { aggregateBy, ...bazaarInput } =
    aggregateOriginsInputSchema.parse(input);

  // Fetch ALL sellers without limit to get accurate aggregation
  const allSellersPagination = {
    ...pagination,
    limit: Number.MAX_SAFE_INTEGER, // Remove limit for initial aggregation
  };

  // Get sellers grouped by origin from bazaar
  const bazaarResult = await listBazaarSellers(
    bazaarInput,
    allSellersPagination
  );

  // Extract unique origin IDs from bazaar results
  const originIds = new Set<string>();
  for (const item of bazaarResult.items) {
    for (const origin of item.origins) {
      originIds.add(origin.id);
    }
  }

  // Fetch full origin data from database for these origins
  const originsFromDb = await prisma.resourceOrigin.findMany({
    where: {
      id: {
        in: Array.from(originIds),
      },
    },
    include: {
      ogImages: true,
      resources: {
        include: {
          accepts: {
            select: {
              payTo: true,
            },
          },
        },
      },
    },
  });

  // Create a map for quick lookup
  const originDbMap = new Map<string, (typeof originsFromDb)[number]>();
  for (const origin of originsFromDb) {
    originDbMap.set(origin.id, origin);
  }

  // Aggregate by origin
  type OriginWithRelations = (typeof originsFromDb)[number];
  const originMap = new Map<
    string,
    {
      origins: OriginWithRelations[];
      recipients: Address[];
      facilitators: FacilitatorAddress[];
      tx_count: number;
      total_amount: number;
      latest_block_timestamp: Date;
      unique_buyers: number;
    }
  >();

  for (const item of bazaarResult.items) {
    // Use the first origin as the primary (they're already grouped by first origin in bazaar)
    const primaryOrigin = item.origins[0];
    const originFromDb = originDbMap.get(primaryOrigin.id);

    if (!originFromDb) continue;

    const existing = originMap.get(primaryOrigin.id);
    if (existing) {
      // Merge data
      existing.recipients.push(...item.recipients);
      existing.tx_count += item.tx_count;
      existing.total_amount += item.total_amount;
      existing.unique_buyers += item.unique_buyers;

      if (item.latest_block_timestamp > existing.latest_block_timestamp) {
        existing.latest_block_timestamp = item.latest_block_timestamp;
      }

      for (const facilitator of item.facilitators) {
        if (!existing.facilitators.includes(facilitator)) {
          existing.facilitators.push(facilitator);
        }
      }
    } else {
      originMap.set(primaryOrigin.id, {
        origins: [originFromDb],
        recipients: [...item.recipients],
        facilitators: [...item.facilitators],
        tx_count: item.tx_count,
        total_amount: item.total_amount,
        latest_block_timestamp: item.latest_block_timestamp,
        unique_buyers: item.unique_buyers,
      });
    }
  }

  // Convert to array and sort by aggregation type
  const allItems = Array.from(originMap.values()).sort((a, b) => {
    switch (aggregateBy) {
      case 'tx_count':
        return b.tx_count - a.tx_count;
      case 'total_amount':
        return b.total_amount - a.total_amount;
      case 'unique_buyers':
        return b.unique_buyers - a.unique_buyers;
      default:
        return 0;
    }
  });

  // Limit to the requested amount
  const items = allItems.slice(0, pagination.limit);
  const hasNextPage = allItems.length > pagination.limit;

  return {
    items,
    hasNextPage,
  };
}
