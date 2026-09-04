import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    PARTNERS_CLICKHOUSE_URL: z.url().default("http://localhost:8124"),
    PARTNERS_CLICKHOUSE_USER: z.string().default("default"),
    PARTNERS_CLICKHOUSE_PASSWORD: z.string().optional(),
    PARTNERS_CLICKHOUSE_DATABASE: z.string().default("default"),
    PARTNERS_CLICKHOUSE_REQUEST_TIMEOUT: z.coerce
      .number()
      .positive()
      .optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
