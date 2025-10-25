import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    POSTGRES_PRISMA_URL: z.url(),
    POSTGRES_URL_NON_POOLING: z.url(),
    TRANSFERS_DB_URL: z.url(),
    CDP_API_KEY_NAME: z.string(),
    CDP_API_KEY_ID: z.string(),
    CDP_API_KEY_SECRET: z.string(),
    CDP_WALLET_SECRET: z.string(),
    ECHO_APP_ID: z.string().optional(),
    HIDE_TRPC_LOGS: z.coerce.boolean().optional(),
    GITHUB_TOKEN: z.string().optional(),
    CRON_SECRET:
      process.env.NEXT_PUBLIC_NODE_ENV === 'development'
        ? z.string().optional()
        : z.string(),
    FREEPIK_API_KEY: z.string().optional(),
    BLOB_READ_WRITE_TOKEN: z.string().optional(),
    FREE_TIER_WALLET_NAME: z.string().optional(),
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
    NEXT_PUBLIC_NODE_ENV: z
      .enum(['development', 'production'])
      .default('development'),
    NEXT_PUBLIC_CDP_PROJECT_ID: z.string().optional(),
    NEXT_PUBLIC_CDP_APP_ID: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().optional(),
    NEXT_PUBLIC_ENABLE_COMPOSER: z.string().optional().default('false'),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_ENV === 'production'
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : process.env.VERCEL_ENV === 'preview'
          ? `https://${process.env.VERCEL_BRANCH_URL}`
          : 'http://localhost:3000'),
    NEXT_PUBLIC_NODE_ENV: process.env.NODE_ENV ?? 'development',
    NEXT_PUBLIC_CDP_PROJECT_ID: process.env.NEXT_PUBLIC_CDP_PROJECT_ID,
    NEXT_PUBLIC_CDP_APP_ID: process.env.NEXT_PUBLIC_CDP_APP_ID,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_ENABLE_COMPOSER: process.env.NEXT_PUBLIC_ENABLE_COMPOSER,
  },
  emptyStringAsUndefined: true,
});
