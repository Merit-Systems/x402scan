import z from 'zod';

import { chainSchema, mixedAddressSchema } from '@/lib/schemas';
import { toPaginatedResponse } from '@/lib/pagination';

import { baseListQuerySchema } from '../schemas';
import {
  createCachedPaginatedQuery,
  createStandardCacheKey,
} from '@/lib/cache';
import { queryRaw } from '@/services/transfers/client';
import { transfersWhereClause } from '../query-utils';

import type { paginatedQuerySchema } from '@/lib/pagination';

const SELLERS_SORT_IDS = [
  'tx_count',
  'total_amount',
  'latest_block_timestamp',
  'unique_buyers',
] as const;

export type SellerSortId = (typeof SELLERS_SORT_IDS)[number];

export const listTopSellersInputSchema = baseListQuerySchema({
  sortIds: SELLERS_SORT_IDS,
  defaultSortId: 'tx_count',
});

const listTopSellersUncached = async (
  input: z.infer<typeof listTopSellersInputSchema>,
  pagination: z.infer<typeof paginatedQuerySchema>
) => {
  const { sorting } = input;
  const { page_size, page } = pagination;
  const whereClause = transfersWhereClause(input);
  const sortDirection = sorting.desc ? 'DESC' : 'ASC';
  const offset = page * page_size;

  const [count, items] = await Promise.all([
    queryRaw(
      `
        SELECT uniq(recipient) AS count
        FROM public_TransferEvent
        ${whereClause}
      `,
      z.array(
        z.object({
          count: z.coerce.number(),
        })
      )
    ).then(result => result[0]?.count ?? 0),
    queryRaw(
      `
      SELECT 
        recipient,
        groupArrayDistinct(facilitator_id) as facilitator_ids,
        COUNT(*) as tx_count,
        SUM(amount) as total_amount,
        MAX(block_timestamp) as latest_block_timestamp,
        uniq(sender) as unique_buyers,
        groupArrayDistinct(chain) as chains
      FROM public_TransferEvent
      ${whereClause}
      GROUP BY recipient
      ORDER BY ${sorting.id} ${sortDirection}
      LIMIT ${page_size + 1}
      OFFSET ${offset}`,
      z.array(
        z.object({
          recipient: mixedAddressSchema,
          facilitator_ids: z.array(z.string()),
          tx_count: z.coerce.number(),
          total_amount: z.number(),
          latest_block_timestamp: z.coerce.date(),
          unique_buyers: z.coerce.number(),
          chains: z.array(chainSchema),
        })
      )
    ),
  ]);

  return toPaginatedResponse({
    items,
    total_count: count,
    ...pagination,
  });
};

export const listTopSellers = createCachedPaginatedQuery({
  queryFn: listTopSellersUncached,
  cacheKeyPrefix: 'sellers-list',
  createCacheKey: createStandardCacheKey,
  dateFields: ['latest_block_timestamp'],
  tags: ['sellers'],
});
