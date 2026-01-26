import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  workspaces: {
    '.': {},
    'apps/scan': {
      entry: [
        'src/app/**/{error,layout,loading,not-found,page,template,default,forbidden,global-not-found,global-error}.{js,jsx,ts,tsx}',
        'src/app/**/route.{js,jsx,ts,tsx}',
      ],
      project: ['src/**/*.{ts,tsx}', '*.{ts,tsx,js,mjs}'],
      ignoreDependencies: ['postcss', 'redis', 'tailwindcss', 'tw-animate-css'],
      ignore: [
        'src/scripts/**',
        'src/components/ui/charts/chart/**',
        'src/lib/telemetry/signoz-logs.ts',
      ],
    },
    'apps/proxy': {},
    'apps/rpcs/solana': {},
    'packages/external/facilitators': {
      project: ['src/**/*.ts'],
    },
    'packages/internal/databases/scan': {
      project: ['src/**/*.ts'],
      ignoreDependencies: ['rimraf', '@prisma/client'],
      ignore: ['generated/**'],
    },
    'packages/internal/databases/analytics': {
      project: ['src/**/*.ts'],
    },
    'packages/internal/databases/transfers': {
      project: ['src/**/*.ts'],
      ignoreDependencies: ['rimraf', '@prisma/client'],
      ignore: ['generated/**'],
    },
    'packages/internal/configurations/eslint': {
      entry: ['*.js'],
      project: ['**/*.{js,mjs}'],
    },
    'sync/analytics': {
      entry: ['trigger/**/*.ts'],
      project: ['trigger/**/*.ts'],
      ignoreDependencies: ['@trigger.dev/build'],
    },
    'sync/transfers': {
      entry: ['trigger/**/*.ts', 'db/**/*.ts'],
      project: ['trigger/**/*.ts', 'db/**/*.ts'],
      ignoreDependencies: ['p-limit', '@trigger.dev/build'],
      ignore: ['generated/**'],
    },
    'sync/alerts': {
      entry: ['trigger/**/*.ts'],
      project: ['trigger/**/*.ts'],
      ignoreDependencies: ['@trigger.dev/build'],
    },
    'examples/servers/express': {},
    'examples/servers/hono': {},
    'packages/external/mcp': {
      ignoreDependencies: ['@anthropic-ai/claude-agent-sdk', 'promptfoo'],
      ignore: ['evals/**'],
    },
  },
  ignore: [
    '**/*.test.{ts,tsx,js,jsx}',
    '**/*.spec.{ts,tsx,js,jsx}',
    '**/dist/**',
    '**/build/**',
    '**/.next/**',
    '**/node_modules/**',
    '**/generated/**',
    '**/*.d.ts',
    '.github/**',
    'packages/internal/configurations/typescript/**',
  ],
};

export default config;
