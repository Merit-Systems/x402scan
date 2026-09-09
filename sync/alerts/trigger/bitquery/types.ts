import { z } from "zod";

export const bitqueryUsageResponseSchema = z.object({
  account_id: z.number(),
  payer_id: z.number(),
  status: z.enum(["active", "grace", "blocked", "expired"]),
  billing_period: z.object({
    started_at: z.string(),
    ended_at: z.string(),
    plan_name: z.string(),
    limits: z.object({
      points_limit: z.number(),
      mcp_points_limit: z.number(),
    }),
    usage: z.object({
      points_usage: z.number(),
      mcp_points_usage: z.number(),
    }),
  }),
});

export type BitqueryUsageResponse = z.infer<typeof bitqueryUsageResponseSchema>;
