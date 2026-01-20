import z from 'zod';

export const mcpSearchParamsSchema = z.object({
  code: z.string().optional(),
});

export type McpSearchParams = z.infer<typeof mcpSearchParamsSchema>;
