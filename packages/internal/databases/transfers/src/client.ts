import { PrismaClient } from '../generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

import { neonConfig } from '@neondatabase/serverless';

import { readReplicas } from './read-replicas/extension';

import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const STATEMENT_TIMEOUT_MS = 15_000;
const IDLE_SESSION_TIMEOUT_MS = 30_000;
const CONNECT_TIMEOUT_S = 10;

function withConnectionDefaults(connectionString: string): string {
  const url = new URL(connectionString);
  url.searchParams.set(
    'options',
    `-c statement_timeout=${STATEMENT_TIMEOUT_MS} -c idle_session_timeout=${IDLE_SESSION_TIMEOUT_MS}`
  );
  url.searchParams.set('connect_timeout', String(CONNECT_TIMEOUT_S));
  url.searchParams.set('sslnegotiation', 'direct');
  return url.toString();
}

const globalForPrisma = global as unknown as {
  transfersDb: PrismaClient;
  transfersDbAdapter: PrismaNeon;
};

const transfersDbAdapter =
  globalForPrisma.transfersDbAdapter ||
  new PrismaNeon({
    connectionString: withConnectionDefaults(process.env.TRANSFERS_DB_URL!),
  });
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

const createReplicaClient = (url: string) => {
  return new PrismaClient({
    adapter: new PrismaNeon({
      connectionString: withConnectionDefaults(url),
    }),
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
