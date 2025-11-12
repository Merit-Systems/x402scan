import { PrismaClient } from '../generated/client';
import { PrismaNeon } from '@prisma/adapter-neon';

import { neonConfig } from '@neondatabase/serverless';

import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const connectionString = `${process.env.POSTGRES_PRISMA_URL}`;

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

// Explicitly export Prisma types and enums instead of using export *
export { Prisma } from '../generated/client';
export type {
  User,
  Account,
  Session,
  VerificationToken,
  Resources,
  Accepts,
  News,
  ResourceOrigin,
  ResourceResponse,
  ResourceInvocation,
  ResourceRequestMetadata,
  OgImage,
  OnrampSession,
  ServerWallet,
  Chat,
  Message,
  ToolCall,
  AgentConfiguration,
  AgentConfigurationResource,
  AgentConfigurationUser,
  Tag,
  ResourcesTags,
  ExcludedResource,
  UserAcknowledgement,
  ResourceOriginMetrics,
  ResourceMetrics,
} from '../generated/client';
export { 
  Role,
  ResourceType,
  AcceptsScheme,
  AcceptsNetwork,
  SessionStatus,
  ServerWalletType,
  Visibility,
} from '../generated/client';
