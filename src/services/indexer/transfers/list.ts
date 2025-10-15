import z from 'zod';
import { queryIndexerDb } from '../client';
import {
  ethereumAddressSchema,
  ethereumHashSchema,
  facilitatorAddressSchema,
} from '@/lib/schemas';
import { toPaginatedResponse } from '@/lib/pagination';
import { baseQuerySchema, sortingSchema } from '../lib';
import { createCachedPaginatedQuery, createStandardCacheKey } from '@/lib/cache';

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
    chain,
    sorting,
  } = parseResult.data;

  let paramIndex = 1;
  const params: unknown[] = [facilitators, tokens, chain];
  
  let whereClause = `
    WHERE transaction_from = ANY($${paramIndex++})
      AND address = ANY($${paramIndex++})
      AND chain = $${paramIndex++}
  `;

  if (recipient) {
    whereClause += ` AND recipient = $${paramIndex++}`;
    params.push(recipient);
  }
  
  if (startDate) {
    whereClause += ` AND block_timestamp > $${paramIndex++}`;
    params.push(startDate);
  }
  
  if (endDate) {
    whereClause += ` AND block_timestamp < $${paramIndex++}`;
    params.push(endDate);
  }

  params.push(limit + 1);

  const sql = `
    SELECT
      sender,
      recipient,
      amount::bigint,
      transaction_from,
      address AS token_address,
      tx_hash AS transaction_hash,
      block_timestamp
    FROM "TransferEvent"
    ${whereClause}
    ORDER BY ${sorting.id} ${sorting.desc ? 'DESC' : 'ASC'}
    LIMIT $${paramIndex++}
  `;

  const result = await queryIndexerDb<{
    sender: string;
    recipient: string;
    amount: bigint;
    transaction_from: string;
    token_address: string;
    transaction_hash: string;
    block_timestamp: Date;
  }>(sql, params);

  return toPaginatedResponse({
    items: result ?? [],
    limit,
  });
};

export const listFacilitatorTransfers = createCachedPaginatedQuery({
  queryFn: listFacilitatorTransfersUncached,
  cacheKeyPrefix: 'transfers-list',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['block_timestamp'],
  tags: ['transfers'],
});

