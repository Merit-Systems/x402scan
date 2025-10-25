import { PrismaClient as TransfersPrismaClient } from '.prisma/client-transfers';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { env } from '@/env';
import type { Sql } from '@prisma/client/runtime/library';
import type z from 'zod';

neonConfig.webSocketConstructor = ws;

const connectionString = env.TRANSFERS_DB_URL;
const adapter = new PrismaNeon({ connectionString });

const globalForTransfersPrisma = global as unknown as {
  transfersPrisma: TransfersPrismaClient;
};

export const transfersPrisma =
  globalForTransfersPrisma.transfersPrisma ??
  new TransfersPrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForTransfersPrisma.transfersPrisma = transfersPrisma;
}

export const queryRaw = async <T>(sql: Sql, resultSchema: z.ZodSchema<T>) => {
  const result = await transfersPrisma.$queryRaw<T>(sql);
  const parseResult = resultSchema.safeParse(result);
  if (!parseResult.success) {
    throw new Error('Invalid result: ' + parseResult.error.message);
  }
  return parseResult.data;
};
