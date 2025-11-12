import { transfersDb } from '@x402scan/transfers-db';

import type { Prisma } from '@x402scan/transfers-db';
import type z from 'zod';

export const queryRaw = async <T>(
  sql: Prisma.Sql,
  resultSchema: z.ZodSchema<T>
) => {
  const result = await transfersDb.$replica().$queryRaw<T>(sql);
  const parseResult = resultSchema.safeParse(result);
  if (!parseResult.success) {
    throw new Error('Invalid result: ' + parseResult.error.message);
  }
  return parseResult.data;
};
