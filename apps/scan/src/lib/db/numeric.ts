import z from 'zod';

/**
 * Standard Zod schema for aggregate numeric values returned by raw SQL queries
 * (COUNT, SUM, etc.) in CDP-SQL / Postgres services.
 *
 * Background: the `pg` driver and Prisma's `queryRaw` surface `COUNT()` / `SUM()`
 * as JavaScript `BigInt` (or as strings when the value exceeds the safe-integer
 * range). Previously these were parsed with `z.bigint()`, which is:
 *   1. Not serializable by Next.js' `unstable_cache` / `'use cache'` — any service
 *      wrapped by `createCachedQuery`/`createCachedPaginatedQuery` crashes at the
 *      cache boundary with `TypeError: Do not know how to serialize a BigInt`.
 *   2. Awkward for consumers — every call site had to `Number(row.value)` before
 *      chart libs / `Intl.NumberFormat` could handle it.
 *
 * `aggregateCount` is the project-wide standard: it accepts bigint / number /
 * numeric-string inputs and always yields a plain `number`. For the aggregate
 * domains x402scan tracks (tool calls, user counts, transfer counts, volume
 * in base units) the values are well inside `Number.MAX_SAFE_INTEGER`
 * (2^53 − 1 ≈ 9 × 10^15) so this is lossless in practice; if a future aggregate
 * can exceed that range, use `aggregateString` instead and keep arbitrary
 * precision as a string on the wire.
 */
export const aggregateCount = z
  .union([z.bigint(), z.number(), z.string()])
  .transform((value, ctx) => {
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'aggregateCount must be a finite number',
        });
        return z.NEVER;
      }
      return value;
    }
    if (typeof value === 'bigint') {
      if (
        value > BigInt(Number.MAX_SAFE_INTEGER) ||
        value < BigInt(Number.MIN_SAFE_INTEGER)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'aggregateCount exceeds Number.MAX_SAFE_INTEGER — use aggregateString',
        });
        return z.NEVER;
      }
      return Number(value);
    }
    // string
    if (!/^-?\d+(\.\d+)?$/.test(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `aggregateCount received non-numeric string: ${value}`,
      });
      return z.NEVER;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'aggregateCount string did not parse to finite number',
      });
      return z.NEVER;
    }
    return parsed;
  });

/**
 * Standard schema for aggregate numeric values that can exceed
 * `Number.MAX_SAFE_INTEGER` (e.g. on-chain token amounts in base units over
 * long time ranges). Always returns a decimal string — callers that need
 * bigint math can `BigInt(value)`, callers that just format for display can
 * use `Intl.NumberFormat` directly on the string.
 */
export const aggregateString = z
  .union([z.bigint(), z.number(), z.string()])
  .transform((value, ctx) => {
    if (typeof value === 'string') {
      if (!/^-?\d+(\.\d+)?$/.test(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `aggregateString received non-numeric string: ${value}`,
        });
        return z.NEVER;
      }
      return value;
    }
    if (typeof value === 'bigint') return value.toString();
    if (!Number.isFinite(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'aggregateString must be a finite number',
      });
      return z.NEVER;
    }
    return value.toString();
  });
