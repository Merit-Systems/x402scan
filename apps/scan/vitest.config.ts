import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { readFileSync, existsSync } from 'fs';

// Vitest sets NODE_ENV=test by default. `src/env.ts` maps NODE_ENV onto the
// `NEXT_PUBLIC_NODE_ENV` enum (`'development'|'production'`) at runtime, so we
// override here before that mapping runs. `process.env.NODE_ENV` is typed as
// readonly in `@types/node`, so set via the dynamic record form.
(process.env as Record<string, string>).NODE_ENV = 'development';

// Load `.env.test` into process.env synchronously when the config is evaluated,
// so the import graph picked up by test files (notably
// `lib/x402/proxy-fetch` -> `env.ts`) sees a complete set of vars before any
// test module is imported. We don't depend on vite's `loadEnv` because vite
// isn't a direct dependency of this workspace.
const envFile = resolve(__dirname, '.env.test');
if (existsSync(envFile)) {
  const lines = readFileSync(envFile, 'utf8').split('\n');
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    process.env[key] ??= value;
  }
}

export default defineConfig({
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
