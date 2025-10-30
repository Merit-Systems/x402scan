import z from 'zod';

import { Prisma } from '@prisma/client';

import { baseQuerySchema } from '../schemas';

import { queryRaw } from '@/services/transfers/client';

import { transfersWhereClause } from '../query-utils';

export const getFirstTransferTimestampInputSchema = baseQuerySchema;

export const getFirstTransferTimestamp = async (
  input: z.infer<typeof getFirstTransferTimestampInputSchema>
): Promise<Date | null> => {
  const sql = Prisma.sql`
    SELECT t.block_timestamp
    FROM "TransferEvent" t
    ${transfersWhereClause(input)}
    ORDER BY t.block_timestamp ASC
    LIMIT 1
  `;

  const result = await queryRaw(
    sql,
    z.array(
      z.object({
        block_timestamp: z.date(),
      })
    )
  );

  return result[0]?.block_timestamp ?? null;
};
