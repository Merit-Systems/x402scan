import 'server-only';

import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

import { neonConfig } from '@neondatabase/serverless';

import ws from 'ws';

import { env } from '@/env';

neonConfig.webSocketConstructor = ws;

const connectionString = `${env.POSTGRES_PRISMA_URL}`;

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
  neonAdapter: PrismaNeon;
};

// Cache the adapter globally to prevent multiple instances
const adapter =
  globalForPrisma.neonAdapter || new PrismaNeon({ connectionString });
if (process.env.NODE_ENV !== 'production')
  globalForPrisma.neonAdapter = adapter;

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
