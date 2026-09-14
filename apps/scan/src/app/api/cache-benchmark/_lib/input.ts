import { z } from "zod";

export const benchmarkInput = z
  .object({
    run: z.uuid(),
    query: z.enum(["overall", "bucketed", "sellers", "recent-transfers"]),
    mode: z.enum(["next", "redis", "uncached"]),
  })
  .strict();
