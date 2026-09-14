import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const benchmarkEnv = createEnv({
  server: {
    CACHE_BENCHMARK_TOKEN: z.string().min(32).optional(),
    BENCHMARK_RUN_ID: z.uuid().optional(),
    BENCHMARK_OUTPUT: z.string().min(1).optional(),
  },
  runtimeEnv: {
    CACHE_BENCHMARK_TOKEN: process.env.CACHE_BENCHMARK_TOKEN,
    BENCHMARK_RUN_ID: process.env.BENCHMARK_RUN_ID,
    BENCHMARK_OUTPUT: process.env.BENCHMARK_OUTPUT,
  },
});
