import { createClient } from '@clickhouse/client';
import { env } from '@/env';
import type z from 'zod';

export const transfersClickhouse = createClient({
  url: env.TRANSFERS_CLICKHOUSE_HOST ?? 'http://localhost:8123',
  username: env.TRANSFERS_CLICKHOUSE_USER ?? 'default',
  password: env.TRANSFERS_CLICKHOUSE_PASSWORD ?? '',
  database: env.TRANSFERS_CLICKHOUSE_DATABASE ?? 'default',
});

export const queryRaw = async <T>(
  query: string,
  resultSchema: z.ZodSchema<T>
): Promise<T> => {
  const resultSet = await transfersClickhouse.query({
    query,
    format: 'JSONEachRow',
  });
  const result = await resultSet.json<T>();
  const parseResult = resultSchema.safeParse(result);
  if (!parseResult.success) {
    throw new Error('Invalid result: ' + parseResult.error.message);
  }
  return parseResult.data;
};
