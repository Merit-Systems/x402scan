import { PrismaClient } from '../generated/client';

const globalForPrisma = global as unknown as { scanDb: PrismaClient };

export const scanDb = globalForPrisma.scanDb || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.scanDb = scanDb;

export * from '../generated/client';
