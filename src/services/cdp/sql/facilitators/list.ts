import { facilitatorNameMap, facilitators } from '@/lib/facilitators';
import { sortingSchema } from '../lib';
import z from 'zod';
import { ethereumAddressSchema } from '@/lib/schemas';
import { USDC_ADDRESS } from '@/lib/utils';
import { createCachedArrayQuery, createStandardCacheKey } from '@/lib/cache';
import { listTopFacilitators as listTopFacilitatorsFromDb } from '@/services/db/transfers';

const listTopFacilitatorsSortIds = [
  'tx_count',
  'total_amount',
  'latest_block_timestamp',
  'unique_buyers',
  'unique_sellers',
] as const;

export type FacilitatorsSortId = (typeof listTopFacilitatorsSortIds)[number];

export const listTopFacilitatorsInputSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  limit: z.number().default(100),
  sorting: sortingSchema(listTopFacilitatorsSortIds).default({
    id: 'tx_count',
    desc: true,
  }),
  tokens: z.array(ethereumAddressSchema).default([USDC_ADDRESS]),
});

const listTopFacilitatorsUncached = async (
  input: z.input<typeof listTopFacilitatorsInputSchema>
) => {
  const { startDate, endDate, limit, sorting, tokens } =
    listTopFacilitatorsInputSchema.parse(input);

  const results = await listTopFacilitatorsFromDb({
    tokenAddresses: tokens,
    startDate,
    endDate,
    limit,
    sortBy: sorting.id as 'tx_count' | 'total_amount' | 'latest_block_timestamp' | 'unique_buyers' | 'unique_sellers',
    sortDesc: sorting.desc,
  });

  // Sort results
  type SortableResult = typeof results[number];
  const sortKey = sorting.id as keyof SortableResult;
  results.sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    return sorting.desc ? -comparison : comparison;
  });

  // Map facilitator IDs to names and return limited results
  return results
    .slice(0, limit)
    .map(r => {
      const facilitator = facilitators.find(f => 
        f.addresses.some(addr => addr.toLowerCase() === r.facilitator_id.toLowerCase())
      );
      return {
        ...r,
        facilitator_name: facilitator?.name ?? ('Unknown' as const),
        facilitator: facilitator ?? facilitatorNameMap.get('Coinbase')!,
      };
    });
};

export const listTopFacilitators = createCachedArrayQuery({
  queryFn: listTopFacilitatorsUncached,
  cacheKeyPrefix: 'facilitators-list',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['latest_block_timestamp'],

  tags: ['facilitators'],
});
