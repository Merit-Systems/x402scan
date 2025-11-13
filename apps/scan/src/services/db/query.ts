import { scanDb } from '../../../../../databases/scan/src';

import type z from 'zod';
import type { Prisma } from '../../../../../databases/scan/src';

export const queryRaw = async <T>(
  sql: Prisma.Sql,
  resultSchema: z.ZodSchema<T>
) => {
  const result = await scanDb.$queryRaw<T>(sql);

  const parseResult = resultSchema.safeParse(result);

  if (!parseResult.success) {
    // console.error(parseResult.error.issues);
    throw new Error('Invalid result: ' + parseResult.error.message);
  }

  return parseResult.data;
};
