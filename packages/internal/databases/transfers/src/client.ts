import { PrismaClient } from '../generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

import { neon, neonConfig } from '@neondatabase/serverless';

import { readReplicas } from './read-replicas/extension';

import ws from 'ws';

neonConfig.webSocketConstructor = ws;

// TS cannot express ad-hoc properties on globalThis, so a single widening
// assertion models the dev-mode client cache honestly (props may be unset).
const globalForPrisma = global as typeof globalThis & {
  transfersDb?: PrismaClient;
  transfersDbAdapter?: PrismaNeon;
};

const transfersDbAdapter =
  globalForPrisma.transfersDbAdapter ??
  new PrismaNeon({ connectionString: process.env.TRANSFERS_DB_URL! });
if (process.env.NODE_ENV !== 'production')
  globalForPrisma.transfersDbAdapter = transfersDbAdapter;

export const transfersHttpPrimary = neon(process.env.TRANSFERS_DB_URL!);

const replicaUrls = [
  process.env.TRANSFERS_DB_URL_REPLICA_1,
  process.env.TRANSFERS_DB_URL_REPLICA_2,
  process.env.TRANSFERS_DB_URL_REPLICA_3,
  process.env.TRANSFERS_DB_URL_REPLICA_4,
  process.env.TRANSFERS_DB_URL_REPLICA_5,
].filter((url): url is string => !!url);

export const transfersHttpReplicas = replicaUrls.map(url => neon(url));

export const transfersDb =
  globalForPrisma.transfersDb ??
  new PrismaClient({
    adapter: transfersDbAdapter,
  });

const hasReplicas =
  process.env.TRANSFERS_DB_URL_REPLICA_1 !== undefined ||
  process.env.TRANSFERS_DB_URL_REPLICA_2 !== undefined ||
  process.env.TRANSFERS_DB_URL_REPLICA_3 !== undefined ||
  process.env.TRANSFERS_DB_URL_REPLICA_4 !== undefined ||
  process.env.TRANSFERS_DB_URL_REPLICA_5 !== undefined;

const createReplicaClient = (url: string) => {
  return new PrismaClient({
    adapter: new PrismaNeon({ connectionString: url }),
  });
};

export const transfersDbReadReplicas = hasReplicas
  ? transfersDb.$extends(
      readReplicas({
        replicas: [
          ...(process.env.TRANSFERS_DB_URL_REPLICA_1
            ? [createReplicaClient(process.env.TRANSFERS_DB_URL_REPLICA_1)]
            : []),
          ...(process.env.TRANSFERS_DB_URL_REPLICA_2
            ? [createReplicaClient(process.env.TRANSFERS_DB_URL_REPLICA_2)]
            : []),
          ...(process.env.TRANSFERS_DB_URL_REPLICA_3
            ? [createReplicaClient(process.env.TRANSFERS_DB_URL_REPLICA_3)]
            : []),
          ...(process.env.TRANSFERS_DB_URL_REPLICA_4
            ? [createReplicaClient(process.env.TRANSFERS_DB_URL_REPLICA_4)]
            : []),
          ...(process.env.TRANSFERS_DB_URL_REPLICA_5
            ? [createReplicaClient(process.env.TRANSFERS_DB_URL_REPLICA_5)]
            : []),
        ],
      })
    )
  : undefined;
