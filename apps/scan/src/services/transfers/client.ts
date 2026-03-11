import {
  transfersHttpPrimary,
  transfersHttpReplicas,
} from '@x402scan/transfers-db';

import type { Prisma } from '@x402scan/transfers-db';
import type z from 'zod';

const REPLICA_TIMEOUT_MS = 5_000;
const PRIMARY_TIMEOUT_MS = 15_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`QUERY_TIMEOUT after ${ms}ms`)), ms)
    ),
  ]);
}

function toParameterized(sql: Prisma.Sql): [string, unknown[]] {
  let query = sql.strings[0]!;
  for (let i = 1; i < sql.strings.length; i++) {
    query += `$${i}${sql.strings[i]}`;
  }
  return [query, [...sql.values]];
}

export const queryRaw = async <T>(
  sql: Prisma.Sql,
  resultSchema: z.ZodSchema<T>
) => {
  const [query, params] = toParameterized(sql);
  const tag = query.trim().slice(0, 50);
  const t0 = performance.now();
  let rows: unknown;

  if (transfersHttpReplicas.length > 0) {
    const replica =
      transfersHttpReplicas[
        Math.floor(Math.random() * transfersHttpReplicas.length)
      ]!;
    try {
      rows = await withTimeout(
        replica.query(query, params),
        REPLICA_TIMEOUT_MS
      );
    } catch (error) {
      const elapsed = performance.now() - t0;
      console.warn(
        `[queryRaw] replica HTTP failed after ${elapsed.toFixed(0)}ms, retrying primary: ${tag}`,
        error
      );
      rows = await withTimeout(
        transfersHttpPrimary.query(query, params),
        PRIMARY_TIMEOUT_MS
      );
      console.log(
        `[queryRaw] primary HTTP fallback OK in ${(performance.now() - t0).toFixed(0)}ms: ${tag}`
      );
    }
  } else {
    rows = await withTimeout(
      transfersHttpPrimary.query(query, params),
      PRIMARY_TIMEOUT_MS
    );
  }

  const parseResult = resultSchema.safeParse(rows);
  if (!parseResult.success) {
    throw new Error('Invalid result: ' + parseResult.error.message);
  }
  return parseResult.data;
};
