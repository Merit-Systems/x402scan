import z from 'zod';

import {
  toPeekAheadResponse,
  type paginatedQuerySchema,
} from '@/lib/pagination';
import { baseListQuerySchema } from '../schemas';
import {
  createCachedPaginatedQuery,
  createStandardCacheKey,
} from '@/lib/cache';
import { transfersDb } from '@x402scan/transfers-db';
import type { MixedAddress } from '@/types/address';
import type { Chain } from '@/types/chain';
import { transfersWhereObject } from '../query-utils';
import { getAcceptsAddresses } from '@/services/db/resources/accepts';
import { mixedAddressSchema } from '@/lib/schemas';

const TRANSFERS_SORT_IDS = ['block_timestamp', 'amount'] as const;
export type TransfersSortId = (typeof TRANSFERS_SORT_IDS)[number];

export const listFacilitatorTransfersInputSchema = baseListQuerySchema({
  sortIds: TRANSFERS_SORT_IDS,
  defaultSortId: 'block_timestamp',
}).extend({
  verifiedOnly: z.boolean().optional(),
});

const listFacilitatorTransfersUncached = async (
  input: z.infer<typeof listFacilitatorTransfersInputSchema>,
  pagination: z.infer<typeof paginatedQuerySchema>
) => {
  const { sorting } = input;
  const { page_size, page } = pagination;

  // When verifiedOnly is true, get only verified addresses
  let modifiedInput = input;
  if (input.verifiedOnly) {
    const { addressToOrigins } = await getAcceptsAddresses({
      chain: input.chain,
      verified: true,
    });
    const verifiedAddresses = Object.keys(addressToOrigins).map(addr =>
      mixedAddressSchema.parse(addr)
    );

    // If no verified addresses exist, return empty result
    if (verifiedAddresses.length === 0) {
      return toPeekAheadResponse({
        items: [],
        ...pagination,
      });
    }

    // Add verified addresses to recipients.include
    modifiedInput = {
      ...input,
      recipients: {
        ...input.recipients,
        include: verifiedAddresses,
      },
    };
  }

  const where = transfersWhereObject(modifiedInput);
  const transfers = await transfersDb.transferEvent.findMany({
    where,
    orderBy: {
      [sorting.id]: sorting.desc ? 'desc' : 'asc',
    },
    take: page_size + 1,
    skip: page * page_size,
  });

  // Map to expected output format
  const items = transfers.map(transfer => ({
    ...transfer,
    sender: transfer.sender as MixedAddress,
    recipient: transfer.recipient as MixedAddress,
    token_address: transfer.address as MixedAddress,
    transaction_from: transfer.transaction_from as MixedAddress,
    chain: transfer.chain as Chain,
  }));

  return toPeekAheadResponse({
    items,
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
