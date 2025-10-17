import z from 'zod';

import { baseQuerySchema, formatDateForSql } from '../lib';

import { ethereumAddressSchema } from '@/lib/schemas';
import { runBaseSqlQuery } from '../query';

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
  const { addresses, startDate, endDate, facilitators, tokens } =
    parseResult.data;

  const sql = `SELECT block_timestamp
      FROM base.events
      WHERE event_signature = 'Transfer(address,address,uint256)'
        AND address IN (${tokens.map(t => `'${t}'`).join(', ')})
        AND transaction_from IN (${facilitators.map(f => `'${f}'`).join(', ')})
        ${
          addresses && addresses.length > 0
            ? `AND parameters['to']::String IN (${addresses
                .map(a => `'${a}'`)
                .join(', ')})`
            : ''
        }
        ${
          startDate
            ? `AND block_timestamp >= '${formatDateForSql(startDate)}'`
            : ''
        }
        ${endDate ? `AND block_timestamp <= '${formatDateForSql(endDate)}'` : ''}
      ORDER BY block_timestamp ASC
      LIMIT 1
    `;

  const result = await runBaseSqlQuery(
    sql,
    z.array(z.object({ block_timestamp: z.string() }))
  );

  if (!result || result.length === 0) {
    return null;
  }

  return new Date(result[0].block_timestamp);
};
