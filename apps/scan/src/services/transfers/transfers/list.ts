import type z from 'zod';

import {
  toPaginatedResponse,
  type paginatedQuerySchema,
} from '@/lib/pagination';
import { baseListQuerySchema } from '../schemas';
import {
  createCachedPaginatedQuery,
  createStandardCacheKey,
} from '@/lib/cache';
import { transfersPrisma } from '@x402scan/transfers-db';
import type { MixedAddress } from '@/types/address';
import type { Chain } from '@/types/chain';
import { transfersWhereObject } from '../query-utils';

const TRANSFERS_SORT_IDS = ['block_timestamp', 'amount'] as const;
export type TransfersSortId = (typeof TRANSFERS_SORT_IDS)[number];

export const listFacilitatorTransfersInputSchema = baseListQuerySchema({
  sortIds: TRANSFERS_SORT_IDS,
  defaultSortId: 'block_timestamp',
});

const listFacilitatorTransfersUncached = async (
  input: z.infer<typeof listFacilitatorTransfersInputSchema>,
  pagination: z.infer<typeof paginatedQuerySchema>
) => {
  const { sorting } = input;
  const { page_size, page } = pagination;

  const where = transfersWhereObject(input);
  const [count, transfers] = await Promise.all([
    transfersPrisma.transferEvent.count({
      where,
    }),
    transfersPrisma.transferEvent.findMany({
      where,
      orderBy: {
        [sorting.id]: sorting.desc ? 'desc' : 'asc',
      },
      take: page_size + 1,
      skip: page * page_size,
    }),
  ]);

  // Map to expected output format
  const items = transfers.map(transfer => ({
    ...transfer,
    sender: transfer.sender as MixedAddress,
    recipient: transfer.recipient as MixedAddress,
    token_address: transfer.address as MixedAddress,
    transaction_from: transfer.transaction_from as MixedAddress,
    chain: transfer.chain as Chain,
  }));

  return toPaginatedResponse({
    items,
    total_count: count,
    ...pagination,
  });
};

export const listFacilitatorTransfers = createCachedPaginatedQuery({
  queryFn: listFacilitatorTransfersUncached,
  cacheKeyPrefix: 'transfers-list',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['block_timestamp'],
  tags: ['transfers'],
});
