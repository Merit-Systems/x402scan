import { PrismaClient } from "../generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

import { neon, neonConfig } from "@neondatabase/serverless";

import { readReplicas } from "./read-replicas/extension";
import { env } from "./env";

import ws from "ws";

neonConfig.webSocketConstructor = ws;

// TS cannot express ad-hoc properties on globalThis, so a single widening
// assertion models the dev-mode client cache honestly (props may be unset).
const globalForPrisma = global as typeof globalThis & {
  transfersDb?: PrismaClient;
  transfersDbAdapter?: PrismaNeon;
};

const transfersDatabaseUrl = env.TRANSFERS_DB_URL;
if (!transfersDatabaseUrl) throw new Error("TRANSFERS_DB_URL is required");

const transfersDbAdapter =
  globalForPrisma.transfersDbAdapter ??
  new PrismaNeon({ connectionString: transfersDatabaseUrl });
if (env.NODE_ENV !== "production")
  globalForPrisma.transfersDbAdapter = transfersDbAdapter;

export const transfersHttpPrimary = neon(transfersDatabaseUrl);

const replicaUrls = [
  env.TRANSFERS_DB_URL_REPLICA_1,
  env.TRANSFERS_DB_URL_REPLICA_2,
  env.TRANSFERS_DB_URL_REPLICA_3,
  env.TRANSFERS_DB_URL_REPLICA_4,
  env.TRANSFERS_DB_URL_REPLICA_5,
].filter((url): url is string => !!url);

export const transfersHttpReplicas = replicaUrls.map((url) => neon(url));

export const transfersDb =
  globalForPrisma.transfersDb ??
  new PrismaClient({
    adapter: transfersDbAdapter,
  });

const createReplicaClient = (url: string) => {
  return new PrismaClient({
    adapter: new PrismaNeon({ connectionString: url }),
  });
};

export const transfersDbReadReplicas =
  replicaUrls.length > 0
    ? transfersDb.$extends(
        readReplicas({
          replicas: replicaUrls.map(createReplicaClient),
        })
      )
    : undefined;
