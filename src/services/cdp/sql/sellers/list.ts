import z from 'zod';

import { ethereumAddressSchema } from '@/lib/schemas';
import { toPaginatedResponse } from '@/lib/pagination';

import type { infiniteQuerySchema } from '@/lib/pagination';
import { baseQuerySchema, sortingSchema } from '../lib';
import {
  createCachedPaginatedQuery,
  createStandardCacheKey,
} from '@/lib/cache';
import { listTopSellers as listTopSellersFromDb } from '@/services/db/transfers';

const sellerSortIds = [
  'tx_count',
  'total_amount',
  'latest_block_timestamp',
  'unique_buyers',
] as const;

export type SellerSortId = (typeof sellerSortIds)[number];

export const listTopSellersInputSchema = baseQuerySchema.extend({
  sorting: sortingSchema(sellerSortIds),
  addresses: z.array(ethereumAddressSchema).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

const listTopSellersUncached = async (
  input: z.input<typeof listTopSellersInputSchema>,
  pagination: z.infer<ReturnType<typeof infiniteQuerySchema<bigint>>>
) => {
  const parseResult = listTopSellersInputSchema.safeParse(input);
  if (!parseResult.success) {
    throw new Error('Invalid input: ' + parseResult.error.message);
  }
  const { sorting, addresses, startDate, endDate, facilitators, tokens } =
    parseResult.data;
  const { limit } = pagination;

  const results = await listTopSellersFromDb({
    facilitatorIds: facilitators,
    tokenAddresses: tokens,
    recipientAddresses: addresses,
    startDate,
    endDate,
    limit: limit + 1,
    sortBy: sorting.id as 'tx_count' | 'total_amount' | 'latest_block_timestamp' | 'unique_buyers',
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

  return toPaginatedResponse({
    items: results,
    limit,
  });
};

const _listTopSellersCached = createCachedPaginatedQuery({
  queryFn: ({
    input,
    pagination,
  }: {
    input: z.input<typeof listTopSellersInputSchema>;
    pagination: z.infer<ReturnType<typeof infiniteQuerySchema<bigint>>>;
  }) => listTopSellersUncached(input, pagination),
  cacheKeyPrefix: 'sellers-list',
  createCacheKey: ({ input, pagination }) =>
    createStandardCacheKey({ ...input, limit: pagination.limit }),
  dateFields: ['latest_block_timestamp'],

  tags: ['sellers'],
});

export const listTopSellers = async (
  input: z.input<typeof listTopSellersInputSchema>,
  pagination: z.infer<ReturnType<typeof infiniteQuerySchema<bigint>>>
) => _listTopSellersCached({ input, pagination });
