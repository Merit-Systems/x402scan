import z from 'zod';
import { queryIndexerDb } from '../client';
import { ethereumAddressSchema } from '@/lib/schemas';
import { toPaginatedResponse } from '@/lib/pagination';
import type { infiniteQuerySchema } from '@/lib/pagination';
import { baseQuerySchema, sortingSchema } from '../lib';
import { createCachedPaginatedQuery, createStandardCacheKey } from '@/lib/cache';

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
  const { sorting, addresses, startDate, endDate, facilitators, tokens, chain } =
    parseResult.data;
  const { limit } = pagination;

  let paramIndex = 1;
  const params: unknown[] = [tokens, facilitators, chain];
  
  let whereClause = `
    WHERE address = ANY($${paramIndex++})
      AND transaction_from = ANY($${paramIndex++})
      AND chain = $${paramIndex++}
  `;

  if (addresses) {
    whereClause += ` AND recipient = ANY($${paramIndex++})`;
    params.push(addresses);
  }
  
  if (startDate) {
    whereClause += ` AND block_timestamp >= $${paramIndex++}`;
    params.push(startDate);
  }
  
  if (endDate) {
    whereClause += ` AND block_timestamp <= $${paramIndex++}`;
    params.push(endDate);
  }

  params.push(limit + 1);

  const sql = `
    SELECT 
      recipient,
      COUNT(*)::bigint AS tx_count,
      SUM(amount::numeric)::bigint AS total_amount,
      MAX(block_timestamp) AS latest_block_timestamp,
      COUNT(DISTINCT sender)::bigint AS unique_buyers,
      ARRAY_AGG(DISTINCT transaction_from) AS facilitators
    FROM "TransferEvent"
    ${whereClause}
    GROUP BY recipient
    ORDER BY ${sorting.id} ${sorting.desc ? 'DESC' : 'ASC'}
    LIMIT $${paramIndex++}
  `;

  const items = await queryIndexerDb<{
    recipient: string;
    facilitators: string[];
    tx_count: string;
    total_amount: string;
    latest_block_timestamp: Date;
    unique_buyers: string;
  }>(sql, params);

  if (!items) {
    return toPaginatedResponse({ items: [], limit });
  }

  const processedItems = items.map(item => ({
    recipient: item.recipient,
    facilitators: item.facilitators,
    tx_count: Number(item.tx_count),
    total_amount: Number(item.total_amount),
    latest_block_timestamp: item.latest_block_timestamp,
    unique_buyers: Number(item.unique_buyers),
  }));

  return toPaginatedResponse({ items: processedItems, limit });
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

