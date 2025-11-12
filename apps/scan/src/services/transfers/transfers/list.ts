import z from 'zod';

import {
  toPaginatedResponse,
  type paginatedQuerySchema,
} from '@/lib/pagination';
import { baseListQuerySchema } from '../schemas';
import {
  createCachedPaginatedQuery,
  createStandardCacheKey,
} from '@/lib/cache';
import { queryRaw } from '@/services/transfers/client';
import type { MixedAddress } from '@/types/address';
import type { Chain } from '@/types/chain';
import { transfersWhereClause } from '../query-utils';
import { mixedAddressSchema, chainSchema } from '@/lib/schemas';

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

  const whereClause = transfersWhereClause(input);
  const sortDirection = sorting.desc ? 'DESC' : 'ASC';
  const offset = page * page_size;

  const [countResult, transfers] = await Promise.all([
    queryRaw(
      `
        SELECT COUNT(*) as count
        FROM public_TransferEvent
        ${whereClause}
      `,
      z.array(z.object({ count: z.coerce.number() }))
    ),
    queryRaw(
      `
        SELECT 
          transaction_from,
          sender,
          recipient,
          amount,
          block_timestamp,
          tx_hash,
          chain,
          provider,
          decimals,
          facilitator_id,
          log_index
        FROM public_TransferEvent
        ${whereClause}
        ORDER BY ${sorting.id} ${sortDirection}
        LIMIT ${page_size + 1}
        OFFSET ${offset}
      `,
      z.array(
        z.object({
          transaction_from: mixedAddressSchema,
          sender: mixedAddressSchema,
          recipient: mixedAddressSchema,
          amount: z.number(),
          block_timestamp: z.coerce.date(),
          tx_hash: z.string(),
          chain: chainSchema,
          provider: z.string(),
          decimals: z.coerce.number(),
          facilitator_id: z.string(),
          log_index: z.coerce.number(),
        })
      )
    ),
  ]);

  const count = countResult[0]?.count ?? 0;

  // Map to expected output format
  const items = transfers.map(transfer => ({
    ...transfer,
    sender: transfer.sender as MixedAddress,
    recipient: transfer.recipient as MixedAddress,
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
