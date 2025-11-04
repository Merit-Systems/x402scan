import z from 'zod';
import { Prisma } from '@prisma/client';

import { chainSchema, mixedAddressSchema } from '@/lib/schemas';
import { toPaginatedResponse } from '@/lib/pagination';

import { baseListQuerySchema } from '../schemas';
import {
  createCachedPaginatedQuery,
  createStandardCacheKey,
} from '@/lib/cache';
import { queryRaw } from '@/services/transfers/client';
import { transfersWhereClause } from '../query-utils';
import { paginationClause } from '@/lib/pagination';

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

  const [count, items] = await Promise.all([
    queryRaw(
      Prisma.sql`
        SELECT COUNT(DISTINCT t.recipient)::integer AS count
        FROM "TransferEvent" t
        ${transfersWhereClause(input)}
      `,
      z.array(
        z.object({
          count: z.number(),
        })
      )
    ).then(result => result[0]?.count ?? 0),
    queryRaw(
      Prisma.sql`
      SELECT 
        t.recipient,
        ARRAY_AGG(DISTINCT t.facilitator_id) as facilitator_ids,
        COUNT(*)::integer as tx_count,
        SUM(t.amount)::float as total_amount,
        MAX(t.block_timestamp) as latest_block_timestamp,
        COUNT(DISTINCT t.sender)::integer as unique_buyers,
        ARRAY_AGG(DISTINCT t.chain) as chains
      FROM "TransferEvent" t
      ${transfersWhereClause(input)}
      GROUP BY t.recipient
      ORDER BY ${Prisma.raw(`"${sorting.id}"`)} ${sorting.desc ? Prisma.raw('DESC') : Prisma.raw('ASC')}
      ${paginationClause(pagination)}`,
      z.array(
        z.object({
          recipient: mixedAddressSchema,
          facilitator_ids: z.array(z.string()),
          tx_count: z.number(),
          total_amount: z.number(),
          latest_block_timestamp: z.date(),
          unique_buyers: z.number(),
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
