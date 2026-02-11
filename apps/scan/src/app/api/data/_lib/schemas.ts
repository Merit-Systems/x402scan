import z from 'zod';

// ── Reusable primitives ──────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(0)
    .default(0)
    .describe('Page index (0-based)'),
  page_size: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(10)
    .describe('Items per page (1-100, default 10)'),
});

export const chainFilterSchema = z
  .enum(['base', 'solana'])
  .optional()
  .describe('Filter by chain');

export const timeframeSchema = z.coerce
  .number()
  .pipe(z.union([z.literal(1), z.literal(7), z.literal(14), z.literal(30)]))
  .optional()
  .describe('Days lookback (1, 7, 14, or 30)');

export const sortOrderSchema = z
  .enum(['asc', 'desc'])
  .default('desc')
  .describe('Sort direction');

// ── Per-endpoint schemas ─────────────────────────────

export const walletTransactionsQuerySchema = paginationSchema.extend({
  chain: chainFilterSchema,
  timeframe: timeframeSchema,
  sort_by: z.enum(['time', 'amount']).default('time').describe('Sort field'),
  sort_order: sortOrderSchema,
});

export const walletStatsQuerySchema = z.object({
  chain: chainFilterSchema,
  timeframe: timeframeSchema,
});

export const merchantsListQuerySchema = paginationSchema.extend({
  chain: chainFilterSchema,
  timeframe: timeframeSchema,
  sort_by: z
    .enum(['volume', 'tx_count', 'unique_buyers'])
    .default('volume')
    .describe('Sort field'),
});

export const merchantTransactionsQuerySchema = paginationSchema.extend({
  chain: chainFilterSchema,
  timeframe: timeframeSchema,
  sort_by: z.enum(['time', 'amount']).default('time').describe('Sort field'),
  sort_order: sortOrderSchema,
});

export const merchantStatsQuerySchema = z.object({
  chain: chainFilterSchema,
  timeframe: timeframeSchema,
});

export const facilitatorsListQuerySchema = paginationSchema.extend({
  chain: chainFilterSchema,
  timeframe: timeframeSchema,
});

export const facilitatorStatsQuerySchema = z.object({
  chain: chainFilterSchema,
  timeframe: timeframeSchema,
});

export const resourcesListQuerySchema = paginationSchema.extend({
  chain: chainFilterSchema,
});

export const resourcesSearchQuerySchema = paginationSchema.extend({
  q: z.string().min(1).describe('Search query'),
  tags: z.string().optional().describe('Comma-separated tag IDs to filter by'),
  chains: z
    .string()
    .optional()
    .describe('Comma-separated chains to filter by (base, solana)'),
});

export const originResourcesQuerySchema = paginationSchema.extend({
  chain: chainFilterSchema,
});
