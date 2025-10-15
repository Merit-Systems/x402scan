import { createTRPCRouter, infiniteQueryProcedure } from '../trpc';
import z from 'zod';
import {
  listTopSellers,
  listTopSellersInputSchema,
} from '@/services/indexer/sellers/list';
import { getAcceptsAddresses } from '@/services/db/accepts';
import type { FacilitatorAddress } from '@/lib/facilitators';
import type { Address } from 'viem';

export const sellersRouter = createTRPCRouter({
  list: {
    all: infiniteQueryProcedure(z.bigint())
      .input(listTopSellersInputSchema)
      .query(async ({ input, ctx: { pagination } }) => {
        return await listTopSellers(input, pagination);
      }),
    bazaar: infiniteQueryProcedure(z.bigint())
      .input(listTopSellersInputSchema)
      .query(async ({ input, ctx: { pagination } }) => {
        const originsByAddress = await getAcceptsAddresses();

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
        const groupedItems = Array.from(originMap.values()).map(item => ({
          recipients: item.recipients,
          origins: item.origins,
          facilitators: item.facilitators,
          tx_count: item.tx_count,
          total_amount: item.total_amount,
          latest_block_timestamp: item.latest_block_timestamp,
          unique_buyers: item.unique_buyers,
        }));

        return {
          items: groupedItems,
          hasNextPage: result.hasNextPage,
        };
      }),
  },
});
