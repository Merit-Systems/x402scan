import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    TRANSFERS_DB_URL: z.url().optional(),
    TRANSFERS_DB_URL_REPLICA_1: z.url().optional(),
    TRANSFERS_DB_URL_REPLICA_2: z.url().optional(),
    TRANSFERS_DB_URL_REPLICA_3: z.url().optional(),
    TRANSFERS_DB_URL_REPLICA_4: z.url().optional(),
    TRANSFERS_DB_URL_REPLICA_5: z.url().optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
