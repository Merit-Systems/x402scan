import { PrismaClient } from '../generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

import { neonConfig } from '@neondatabase/serverless';

import { readReplicas } from './read-replicas/extension';

import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const globalForPrisma = global as unknown as {
  transfersDb: PrismaClient;
  transfersDbAdapter: PrismaNeon;
};

const transfersDbAdapter =
  globalForPrisma.transfersDbAdapter ||
  new PrismaNeon({ connectionString: process.env.TRANSFERS_DB_URL! });
if (process.env.NODE_ENV !== 'production')
  globalForPrisma.transfersDbAdapter = transfersDbAdapter;

export const transfersDb =
  globalForPrisma.transfersDb ||
  new PrismaClient({
    adapter: transfersDbAdapter,
  });

const hasReplicas =
  process.env.TRANSFERS_DB_URL_REPLICA_1 !== undefined ||
  process.env.TRANSFERS_DB_URL_REPLICA_2 !== undefined ||
  process.env.TRANSFERS_DB_URL_REPLICA_3 !== undefined ||
  process.env.TRANSFERS_DB_URL_REPLICA_4 !== undefined ||
  process.env.TRANSFERS_DB_URL_REPLICA_5 !== undefined;

export const transfersDbReadReplicas = hasReplicas
  ? transfersDb.$extends(
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
    )
  : undefined;
