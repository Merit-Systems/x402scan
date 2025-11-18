import 'dotenv/config';
import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    PORT: z.coerce.number().default(3099),
    // Observability
    OTEL_SERVICE_NAME: z.string().min(1),
    OTEL_SERVICE_VERSION: z.string().min(1),
    NODE_ENV: z
      .enum(['development', 'production', 'staging'])
      .default('development'),
    OTEL_EXPORTER_OTLP_LOGS_ENDPOINT: z.string().url(),
    OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: z.string().url(),
    SIGNOZ_INGESTION_KEY: z.string().min(1),
    OTEL_EXPORTER_OTLP_METRICS_ENDPOINT: z.string().url(),
    // ClickHouse Database (for analytics package)
    // The analytics package reads these directly from process.env
    ANALYTICS_CLICKHOUSE_URL: z.string().url().default('http://localhost:8123'),
    ANALYTICS_CLICKHOUSE_USER: z.string().default('default'),
    ANALYTICS_CLICKHOUSE_PASSWORD: z.string().default(''),
    ANALYTICS_CLICKHOUSE_DATABASE: z.string().default('default'),
    ANALYTICS_CLICKHOUSE_REQUEST_TIMEOUT: z.coerce.number().default(30000), // 30 seconds default timeout

    // CDP/Coinbase SDK
    CDP_API_KEY_ID: z.string().min(1),
    CDP_API_KEY_SECRET: z.string().min(1),
    CDP_WALLET_SECRET: z.string().min(1),

    // Optional
    BASE_RPC_URL: z.string().url().optional(),
    ETH_WARNING_THRESHOLD: z.string().default('0.0001'),

    // Cockatiel policy configuration
    RETRY_MAX_ATTEMPTS: z.coerce.number().default(2),
    RETRY_BACKOFF_DELAY: z.coerce.number().default(1000),
    TIMEOUT_LENGTH: z.coerce.number().default(5000),
    REQUEST_TIMEOUT: z.coerce.number().default(30000),
    MAX_FACILITATOR_ATTEMPTS: z.coerce.number().default(3),
    USE_CIRCUIT_BREAKER: z.coerce.boolean().default(true),
    CIRCUIT_BREAKER_HALF_OPEN_AFTER: z.coerce.number().default(120000), // 2 minutes
    CIRCUIT_BREAKER_CONSECUTIVE_FAILURES: z.coerce.number().default(50),

    // Facilitator whitelist
    WHITELISTED_FACILITATOR_IDS: z.preprocess(
      val => {
        if (typeof val === 'string') {
          return val
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
        }
        return val;
      },
      z.array(z.string()).default(['coinbase', 'x402rs', 'payAI'])
    ),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
