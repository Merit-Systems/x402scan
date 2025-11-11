import { createClient } from '@clickhouse/client';
import { env } from '../../../env';

// ClickHouse client configuration
export const clickhouse = createClient({
  url: env.CLICKHOUSE_HOST ?? 'http://localhost:8123',
  username: env.CLICKHOUSE_USER ?? 'default',
  password: env.CLICKHOUSE_PASSWORD ?? '',
  database: env.CLICKHOUSE_DATABASE ?? 'default',
});
