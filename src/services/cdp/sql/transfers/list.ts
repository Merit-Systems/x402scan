import z from 'zod';

import { ethereumAddressSchema } from '@/lib/schemas';
import { baseQuerySchema, sortingSchema } from '../lib';
import {
  createCachedPaginatedQuery,
  createStandardCacheKey,
} from '@/lib/cache';
import { listTransfers } from '@/services/db/transfers';

const listFacilitatorTransfersSortIds = ['block_timestamp', 'amount'] as const;

export type TransfersSortId = (typeof listFacilitatorTransfersSortIds)[number];

export const listFacilitatorTransfersInputSchema = baseQuerySchema.extend({
  recipient: ethereumAddressSchema.optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  limit: z.number().default(100),
  sorting: sortingSchema(listFacilitatorTransfersSortIds).default({
    id: 'block_timestamp',
    desc: true,
  }),
});

const listFacilitatorTransfersUncached = async (
  input: z.input<typeof listFacilitatorTransfersInputSchema>
) => {
  const parseResult = listFacilitatorTransfersInputSchema.safeParse(input);
  if (!parseResult.success) {
    console.error('invalid input', input);
    throw new Error('Invalid input: ' + parseResult.error.message);
  }
  const {
    recipient,
    startDate,
    endDate,
    limit,
    facilitators,
    tokens,
    sorting,
  } = parseResult.data;

  // Use Prisma query instead of CDP
  const result = await listTransfers({
    recipient,
    facilitatorIds: facilitators,
    tokenAddresses: tokens,
    startDate,
    endDate,
    limit,
    sortBy: sorting.id as 'block_timestamp' | 'amount',
    sortDesc: sorting.desc,
  });

  // Map Prisma results to expected format
  return {
    ...result,
    items: result.items.map(transfer => ({
      sender: transfer.sender,
      recipient: transfer.recipient,
      amount: transfer.amount,
      token_address: transfer.address,
      transaction_from: transfer.transaction_from,
      transaction_hash: transfer.tx_hash,
      block_timestamp: transfer.block_timestamp,
      log_index: 0,
    })),
  };
};

export const listFacilitatorTransfers = createCachedPaginatedQuery({
  queryFn: listFacilitatorTransfersUncached,
  cacheKeyPrefix: 'transfers-list',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['block_timestamp'],

  tags: ['transfers'],
});
