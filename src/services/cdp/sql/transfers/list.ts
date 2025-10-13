import z from 'zod';

import { runBaseSqlQuery } from '../query';

import {
  ethereumAddressSchema,
  ethereumHashSchema,
  facilitatorAddressSchema,
} from '@/lib/schemas';
import { toPaginatedResponse } from '@/lib/pagination';
import { baseQuerySchema, formatDateForSql, sortingSchema } from '../lib';
import {
  createCachedPaginatedQuery,
  createStandardCacheKey,
} from '@/lib/cache';
import { usdcAmountSchema } from '@/lib/cdp/numeric-types';

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

const outputSchema = z.array(
  z.object({
    sender: ethereumAddressSchema,
    recipient: ethereumAddressSchema,
    amount: usdcAmountSchema,
    token_address: ethereumAddressSchema,
    transaction_from: facilitatorAddressSchema,
    transaction_hash: ethereumHashSchema,
    block_timestamp: z.coerce.date(),
    log_index: z.number(),
  })
);

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

  const sql = `SELECT
  parameters['from']::String AS sender,
  parameters['to']::String AS recipient,
  parameters['value']::UInt256 AS amount,
  transaction_from,
  address AS token_address,
  transaction_hash,
  block_timestamp,
  log_index
FROM base.events
WHERE event_signature = 'Transfer(address,address,uint256)'
  AND transaction_from IN (${facilitators.map(f => `'${f}'`).join(', ')})
  AND address IN (${tokens.map(t => `'${t}'`).join(', ')})
  ${recipient ? `AND recipient = '${recipient}'` : ''}
  ${startDate ? `AND block_timestamp > '${formatDateForSql(startDate)}'` : ''}
  ${endDate ? `AND block_timestamp < '${formatDateForSql(endDate)}'` : ''}
ORDER BY ${sorting.id} ${sorting.desc ? 'DESC' : 'ASC'}
LIMIT ${limit + 1};`;
  const result = await runBaseSqlQuery(sql, outputSchema);

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
