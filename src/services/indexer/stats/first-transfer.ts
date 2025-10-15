import z from 'zod';
import { queryIndexerDb } from '../client';
import { ethereumAddressSchema } from '@/lib/schemas';
import { baseQuerySchema } from '../lib';

export const getFirstTransferTimestampInputSchema = baseQuerySchema.extend({
  addresses: z.array(ethereumAddressSchema).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export const getFirstTransferTimestamp = async (
  input: z.input<typeof getFirstTransferTimestampInputSchema>
): Promise<Date | null> => {
  const parseResult = getFirstTransferTimestampInputSchema.safeParse(input);
  if (!parseResult.success) {
    throw new Error('Invalid input: ' + parseResult.error.message);
  }
  const { addresses, startDate, endDate, facilitators, tokens, chain } = parseResult.data;

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

  const sql = `
    SELECT block_timestamp
    FROM "TransferEvent"
    ${whereClause}
    ORDER BY block_timestamp ASC
    LIMIT 1
  `;

  const result = await queryIndexerDb<{ block_timestamp: Date }>(sql, params);

  if (!result || result.length === 0) {
    return null;
  }

  return result[0].block_timestamp;
};

