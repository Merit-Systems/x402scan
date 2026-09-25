import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    PORT: z.coerce.number().int().positive().default(6969),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
