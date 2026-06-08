import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
      facilitators: resolve(
        __dirname,
        '../../packages/external/facilitators/src'
      ),
    },
  },
});
