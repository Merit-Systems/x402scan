import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    SCAN_DATABASE_URL: z.url(),
    SCAN_DATABASE_URL_UNPOOLED: z.url(),
    CDP_API_KEY_NAME: z.string(),
    CDP_API_KEY_ID: z.string(),
    CDP_API_KEY_SECRET: z.string(),
    CDP_WALLET_SECRET: z.string(),
    HIDE_TRPC_LOGS: z.coerce.boolean().optional(),
    GITHUB_TOKEN: z.string().optional(),
    CRON_SECRET:
      process.env.NEXT_PUBLIC_NODE_ENV === 'development'
        ? z.string().optional()
        : z.string(),
    FREEPIK_API_KEY: z.string().optional(),
    BLOB_READ_WRITE_TOKEN: z.string().optional(),
    FREE_TIER_WALLET_NAME: z.string(),
    TRANSFERS_DB_URL: z.url(),
    TRANSFERS_DB_URL_REPLICA_1: z.url().optional(),
    TRANSFERS_DB_URL_REPLICA_2: z.url().optional(),
    TRANSFERS_DB_URL_REPLICA_3: z.url().optional(),
    TRANSFERS_DB_URL_REPLICA_4: z.url().optional(),
    TRANSFERS_DB_URL_REPLICA_5: z.url().optional(),
    REDIS_URL: z.string().optional(),
    ECHO_APP_ID: z.string().default('7fed205e-3aa5-44af-83a3-f7ae5e49dba4'),
    ECHO_PROXY_URL: z.url().optional(),
    ANALYTICS_CLICKHOUSE_URL: z.string().url().optional(),
    ANALYTICS_CLICKHOUSE_USER: z.string().optional(),
    ANALYTICS_CLICKHOUSE_PASSWORD: z.string().optional(),
    ANALYTICS_CLICKHOUSE_DATABASE: z.string().optional(),
    JINA_API_KEY: z.string().optional(),
    RESOURCE_SEARCH_API_KEY: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z
      .url()
      .default(
        process.env.NEXT_PUBLIC_APP_URL ??
          (process.env.VERCEL_ENV === 'production'
            ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
            : process.env.VERCEL_ENV === 'preview'
              ? `https://${process.env.VERCEL_BRANCH_URL}`
              : 'http://localhost:3000')
      ),
    NEXT_PUBLIC_PROXY_URL: z.url(),
    NEXT_PUBLIC_NODE_ENV: z
      .enum(['development', 'production'])
      .default('development'),
    NEXT_PUBLIC_CDP_PROJECT_ID: z.string().optional(),
    NEXT_PUBLIC_CDP_APP_ID: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().optional(),
    NEXT_PUBLIC_ENABLE_COMPOSER: z.string().optional().default('true'),
    NEXT_PUBLIC_SOLANA_RPC_URL: z.url().optional(),
    NEXT_PUBLIC_BASE_RPC_URL: z.url().optional(),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_ENV === 'production'
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : process.env.VERCEL_ENV === 'preview'
          ? `https://${process.env.VERCEL_BRANCH_URL}`
          : 'http://localhost:3000'),
    NEXT_PUBLIC_PROXY_URL: process.env.NEXT_PUBLIC_PROXY_URL,
    NEXT_PUBLIC_NODE_ENV: process.env.NODE_ENV ?? 'development',
    NEXT_PUBLIC_CDP_PROJECT_ID: process.env.NEXT_PUBLIC_CDP_PROJECT_ID,
    NEXT_PUBLIC_CDP_APP_ID: process.env.NEXT_PUBLIC_CDP_APP_ID,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_ENABLE_COMPOSER: process.env.NEXT_PUBLIC_ENABLE_COMPOSER,
    NEXT_PUBLIC_SOLANA_RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
    NEXT_PUBLIC_BASE_RPC_URL: process.env.NEXT_PUBLIC_BASE_RPC_URL,
  },
  emptyStringAsUndefined: true,
});
