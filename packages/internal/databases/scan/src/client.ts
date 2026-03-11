import { PrismaClient } from '../generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

import { neonConfig } from '@neondatabase/serverless';

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
  scanDb: PrismaClient;
  scanDbAdapter: PrismaNeon;
};

const scanDbAdapter =
  globalForPrisma.scanDbAdapter ||
  new PrismaNeon({
    connectionString: withConnectionDefaults(process.env.SCAN_DATABASE_URL!),
  });
if (process.env.NODE_ENV !== 'production')
  globalForPrisma.scanDbAdapter = scanDbAdapter;

export const scanDb =
  globalForPrisma.scanDb || new PrismaClient({ adapter: scanDbAdapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.scanDb = scanDb;
