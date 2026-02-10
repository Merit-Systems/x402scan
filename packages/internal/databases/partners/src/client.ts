import { createClient } from '@clickhouse/client';

export const partnersDb = createClient({
  url: process.env.PARTNERS_CLICKHOUSE_URL ?? 'http://localhost:8124',
  username: process.env.PARTNERS_CLICKHOUSE_USER ?? 'default',
  password: process.env.PARTNERS_CLICKHOUSE_PASSWORD,
  database: process.env.PARTNERS_CLICKHOUSE_DATABASE ?? 'default',
  request_timeout: process.env.PARTNERS_CLICKHOUSE_REQUEST_TIMEOUT
    ? Number(process.env.PARTNERS_CLICKHOUSE_REQUEST_TIMEOUT)
    : undefined,
});
