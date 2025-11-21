import { transfersDb, transfersDbReadReplicas } from '@x402scan/transfers-db';

import type { Prisma } from '@x402scan/transfers-db';
import type z from 'zod';

export const queryRaw = async <T>(
  sql: Prisma.Sql,
  resultSchema: z.ZodSchema<T>
) => {
  const db = transfersDbReadReplicas?.$replica() ?? transfersDb;
  const result = await db.$queryRaw<T>(sql);
  const parseResult = resultSchema.safeParse(result);
  if (!parseResult.success) {
    throw new Error('Invalid result: ' + parseResult.error.message);
  }
  return parseResult.data;
};
