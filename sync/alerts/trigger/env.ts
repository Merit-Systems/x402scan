import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    BASE_RPC_URL: z.url().optional(),
    BITQUERY_API_KEY: z.string().optional(),
    DISCORD_MERCHANT_HEALTH_WEBHOOK_URL: z.url().optional(),
    DISCORD_WEBHOOK_URL: z.url().optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
