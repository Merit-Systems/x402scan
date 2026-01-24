import { readFileSync } from 'fs';
import { defineConfig } from 'tsup';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8')) as {
  version: string;
};

export default defineConfig([
  // Default build for npm package (external dependencies)
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    clean: true,
    shims: true,
    noExternal: ['@x402scan/neverthrow', '@x402scan/siwx'],
    outDir: 'dist/esm',
    platform: 'node',
    define: {
      __MCP_VERSION__: JSON.stringify(pkg.version),
    },
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
    define: {
      __MCP_VERSION__: JSON.stringify(pkg.version),
    },
  },
]);
