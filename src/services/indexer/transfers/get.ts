import type z from 'zod';
import { queryIndexerDb } from '../client';
import { ethereumHashSchema } from '@/lib/schemas';
import { baseQuerySchema } from '../lib';

export const getFacilitatorTransferInputSchema = baseQuerySchema.extend({
  transaction_hash: ethereumHashSchema,
});

export const getFacilitatorTransfer = async (
  input: z.input<typeof getFacilitatorTransferInputSchema>
) => {
  const parseResult = getFacilitatorTransferInputSchema.safeParse(input);
  if (!parseResult.success) {
    console.error('invalid input', input);
    throw new Error('Invalid input: ' + parseResult.error.message);
  }
  const { transaction_hash, tokens } = parseResult.data;

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
    WHERE address = ANY($1)
      AND tx_hash = $2
    ORDER BY block_timestamp DESC
    LIMIT 1
  `;

  const result = await queryIndexerDb<{
    sender: string;
    recipient: string;
    amount: bigint;
    transaction_from: string;
    token_address: string;
    transaction_hash: string;
    block_timestamp: Date;
  }>(sql, [tokens, transaction_hash]);

  return result && result.length > 0 ? result[0] : null;
};

