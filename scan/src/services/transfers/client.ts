import { PrismaClient as TransfersPrismaClient } from '.prisma/client-transfers';
import { readReplicas } from '@prisma/extension-read-replicas';
import { env } from '@/env';
import type { Sql } from '@prisma/client/runtime/library';
import type z from 'zod';

export const transfersPrisma = new TransfersPrismaClient().$extends(
  readReplicas({
    url: [
      ...(env.TRANSFERS_DB_URL_REPLICA_1
        ? [env.TRANSFERS_DB_URL_REPLICA_1]
        : []),
      ...(env.TRANSFERS_DB_URL_REPLICA_2
        ? [env.TRANSFERS_DB_URL_REPLICA_2]
        : []),
      ...(env.TRANSFERS_DB_URL_REPLICA_3
        ? [env.TRANSFERS_DB_URL_REPLICA_3]
        : []),
      ...(env.TRANSFERS_DB_URL_REPLICA_4
        ? [env.TRANSFERS_DB_URL_REPLICA_4]
        : []),
      ...(env.TRANSFERS_DB_URL_REPLICA_5
        ? [env.TRANSFERS_DB_URL_REPLICA_5]
        : []),
    ],
  })
);

export const queryRaw = async <T>(sql: Sql, resultSchema: z.ZodSchema<T>) => {
  const result = await transfersPrisma.$replica().$queryRaw<T>(sql);
  const parseResult = resultSchema.safeParse(result);
  if (!parseResult.success) {
    throw new Error('Invalid result: ' + parseResult.error.message);
  }
  return parseResult.data;
};
