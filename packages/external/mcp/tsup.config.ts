import { defineConfig } from 'tsup';

export default defineConfig([
  // Default build for npm package (external dependencies)
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    clean: true,
    shims: true,
  },
]);
