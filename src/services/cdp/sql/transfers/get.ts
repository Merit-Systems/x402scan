import type z from 'zod';

import { ethereumHashSchema } from '@/lib/schemas';
import { baseQuerySchema } from '../lib';
import { getTransferByTxHash } from '@/services/db/transfers';

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
  const { transaction_hash, facilitators } = parseResult.data;

  // Query from transfers database instead of CDP
  const transfer = await getTransferByTxHash(transaction_hash, facilitators);

  if (!transfer) return null;

  // Map to expected output format
  return {
    sender: transfer.sender,
    recipient: transfer.recipient,
    amount: BigInt(Math.floor(transfer.amount * Math.pow(10, transfer.decimals))),
    token_address: transfer.address,
    transaction_hash: transfer.tx_hash,
    block_timestamp: transfer.block_timestamp,
    log_index: 0,
  };
};
