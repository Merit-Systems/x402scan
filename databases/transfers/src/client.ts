import { PrismaClient } from '../generated/client';
import { readReplicas } from '@prisma/extension-read-replicas';

export const transfersPrisma = new PrismaClient().$extends(
  readReplicas({
    url: [
      ...(process.env.TRANSFERS_DB_URL_REPLICA_1
        ? [process.env.TRANSFERS_DB_URL_REPLICA_1]
        : []),
      ...(process.env.TRANSFERS_DB_URL_REPLICA_2
        ? [process.env.TRANSFERS_DB_URL_REPLICA_2]
        : []),
      ...(process.env.TRANSFERS_DB_URL_REPLICA_3
        ? [process.env.TRANSFERS_DB_URL_REPLICA_3]
        : []),
      ...(process.env.TRANSFERS_DB_URL_REPLICA_4
        ? [process.env.TRANSFERS_DB_URL_REPLICA_4]
        : []),
      ...(process.env.TRANSFERS_DB_URL_REPLICA_5
        ? [process.env.TRANSFERS_DB_URL_REPLICA_5]
        : []),
    ],
  })
);
