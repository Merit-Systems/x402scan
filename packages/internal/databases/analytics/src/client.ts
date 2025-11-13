import { createClient } from '@clickhouse/client';

export const createAnalyticsDb = () => {
  console.log(
    'userFromCreateAnalyticsDb',
    process.env.ANALYTICS_CLICKHOUSE_USER
  );
  return createClient({
    url: process.env.ANALYTICS_CLICKHOUSE_URL ?? 'http://localhost:8123',
    username: process.env.ANALYTICS_CLICKHOUSE_USER ?? 'default',
    password: process.env.ANALYTICS_CLICKHOUSE_PASSWORD,
    database: process.env.ANALYTICS_CLICKHOUSE_DATABASE ?? 'default',
    request_timeout: Number(
      process.env.ANALYTICS_CLICKHOUSE_REQUEST_TIMEOUT ?? 10000
    ),
  });
};

export const analyticsDb = createAnalyticsDb();
