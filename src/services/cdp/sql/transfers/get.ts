import z from 'zod';

import { runBaseSqlQuery } from '../query';

import { ethereumAddressSchema, ethereumHashSchema } from '@/lib/schemas';
import { usdcAmountSchema } from '@/lib/cdp/numeric-types';
import { baseQuerySchema } from '../lib';

export const getFacilitatorTransferInputSchema = baseQuerySchema.extend({
  transaction_hash: ethereumHashSchema,
});

const outputSchema = z.array(
  z.object({
    sender: ethereumAddressSchema,
    recipient: ethereumAddressSchema,
    amount: usdcAmountSchema,
    token_address: ethereumAddressSchema,
    transaction_hash: ethereumHashSchema,
    block_timestamp: z.coerce.date(),
    log_index: z.number(),
  })
);

export const getFacilitatorTransfer = async (
  input: z.input<typeof getFacilitatorTransferInputSchema>
) => {
  const parseResult = getFacilitatorTransferInputSchema.safeParse(input);
  if (!parseResult.success) {
    console.error('invalid input', input);
    throw new Error('Invalid input: ' + parseResult.error.message);
  }
  const { transaction_hash, tokens } = parseResult.data;

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
  AND address IN (${tokens.map(t => `'${t}'`).join(', ')})
  AND transaction_hash = '${transaction_hash}'
ORDER BY block_timestamp DESC
LIMIT 1;`;
  const result = await runBaseSqlQuery(sql, outputSchema);

  return result ? result[0] : null;
};
