import z from 'zod';

import { baseQuerySchema } from '../schemas';

import { queryRaw } from '@/services/transfers/client';

import { transfersWhereClause } from '../query-utils';
import { ActivityTimeframe } from '@/types/timeframes';

export const getFirstTransferTimestampInputSchema = baseQuerySchema.omit({
  timeframe: true,
});

export const getFirstTransferTimestamp = async (
  input: z.infer<typeof getFirstTransferTimestampInputSchema>
): Promise<Date | null> => {
  const whereClause = transfersWhereClause({
    ...input,
    timeframe: ActivityTimeframe.AllTime,
  });

  const sql = `
    SELECT block_timestamp
    FROM public_TransferEvent
    ${whereClause}
    ORDER BY block_timestamp ASC
    LIMIT 1
  `;

  const result = await queryRaw(
    sql,
    z.array(
      z.object({
        block_timestamp: z.coerce.date(),
      })
    )
  );

  return result[0]?.block_timestamp ?? null;
};
