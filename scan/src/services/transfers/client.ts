import { PrismaClient as TransfersPrismaClient } from '.prisma/client-transfers';
import { readReplicas } from '@prisma/extension-read-replicas';
import { env } from '@/env';
import type { Sql } from '@prisma/client/runtime/library';
import type z from 'zod';

const replicaUrls = [
  ...(env.TRANSFERS_DB_URL_REPLICA_1 ? [env.TRANSFERS_DB_URL_REPLICA_1] : []),
  ...(env.TRANSFERS_DB_URL_REPLICA_2 ? [env.TRANSFERS_DB_URL_REPLICA_2] : []),
  ...(env.TRANSFERS_DB_URL_REPLICA_3 ? [env.TRANSFERS_DB_URL_REPLICA_3] : []),
  ...(env.TRANSFERS_DB_URL_REPLICA_4 ? [env.TRANSFERS_DB_URL_REPLICA_4] : []),
  ...(env.TRANSFERS_DB_URL_REPLICA_5 ? [env.TRANSFERS_DB_URL_REPLICA_5] : []),
];

const basePrismaClient = new TransfersPrismaClient();

export const transfersPrisma =
  replicaUrls.length > 0
    ? basePrismaClient.$extends(readReplicas({ url: replicaUrls }))
    : basePrismaClient;

export const queryRaw = async <T>(sql: Sql, resultSchema: z.ZodSchema<T>) => {
  const client =
    replicaUrls.length > 0
      ? (transfersPrisma as any).$replica()
      : transfersPrisma;
  const result = await client.$queryRaw<T>(sql);
  const parseResult = resultSchema.safeParse(result);
  if (!parseResult.success) {
    throw new Error('Invalid result: ' + parseResult.error.message);
  }
  return parseResult.data;
};
