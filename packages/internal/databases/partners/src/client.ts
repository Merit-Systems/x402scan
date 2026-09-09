import { createClient } from "@clickhouse/client";
import { env } from "./env";

export const partnersDb = createClient({
  url: env.PARTNERS_CLICKHOUSE_URL,
  username: env.PARTNERS_CLICKHOUSE_USER,
  password: env.PARTNERS_CLICKHOUSE_PASSWORD,
  database: env.PARTNERS_CLICKHOUSE_DATABASE,
  request_timeout: env.PARTNERS_CLICKHOUSE_REQUEST_TIMEOUT,
});
