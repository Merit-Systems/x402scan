import { defineConfig } from 'tsup';

export default defineConfig([
  // Default build for npm package (external dependencies)
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    minify: false,
    splitting: false,
    treeshake: true,
    outDir: 'dist/esm',
  },
  // Bundled build for mcpb (all dependencies included in single file)
  // Uses CJS format to handle dynamic require() calls in dependencies like tweetnacl
  {
    entry: ['src/run-server.ts'],
    outDir: 'dist/cjs',
    format: ['cjs'],
    dts: false,
    clean: true,
    shims: true,
    noExternal: [/.*/], // Bundle all dependencies
    splitting: false, // Single file output
    platform: 'node', // Ensure Node.js built-ins are handled properly
  },
]);
