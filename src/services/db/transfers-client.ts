import 'server-only';

import { PrismaClient as TransfersPrismaClient } from '@prisma/client-transfers';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { env } from '@/env';

neonConfig.webSocketConstructor = ws;

const connectionString = env.TRANSFERS_DB_URL;
const adapter = new PrismaNeon({ connectionString });

const globalForTransfersPrisma = global as unknown as { 
  transfersPrisma: TransfersPrismaClient 
};

export const transfersPrisma = 
  globalForTransfersPrisma.transfersPrisma || 
  new TransfersPrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForTransfersPrisma.transfersPrisma = transfersPrisma;
}

