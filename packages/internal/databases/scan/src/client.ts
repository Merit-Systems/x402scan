import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

import { PrismaClient } from "../generated/prisma/client";
import { env } from "./env";

neonConfig.webSocketConstructor = ws;

// TS cannot express ad-hoc properties on globalThis, so a single widening
// assertion models the dev-mode client cache honestly (props may be unset).
const globalForPrisma = global as typeof globalThis & {
  scanDb?: PrismaClient;
  scanDbAdapter?: PrismaNeon;
};

const scanDatabaseUrl = env.SCAN_DATABASE_URL;
if (!scanDatabaseUrl) throw new Error("SCAN_DATABASE_URL is required");

const scanDbAdapter =
  globalForPrisma.scanDbAdapter ??
  new PrismaNeon({ connectionString: scanDatabaseUrl });
if (env.NODE_ENV !== "production")
  globalForPrisma.scanDbAdapter = scanDbAdapter;

export const scanDb =
  globalForPrisma.scanDb ??
  new PrismaClient({
    adapter: scanDbAdapter,
    omit: { resourceOrigin: { email: true } },
  });

if (env.NODE_ENV !== "production") globalForPrisma.scanDb = scanDb;
