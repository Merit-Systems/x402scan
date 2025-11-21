import { PrismaClient } from '../generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

import { neonConfig } from '@neondatabase/serverless';

import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const connectionString = `${process.env.SCAN_DATABASE_URL}`;

const globalForPrisma = global as unknown as {
  scanDb: PrismaClient;
  scanDbAdapter: PrismaNeon;
};

const scanDbAdapter =
  globalForPrisma.scanDbAdapter || new PrismaNeon({ connectionString });
if (process.env.NODE_ENV !== 'production')
  globalForPrisma.scanDbAdapter = scanDbAdapter;

export const scanDb =
  globalForPrisma.scanDb || new PrismaClient({ adapter: scanDbAdapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.scanDb = scanDb;
