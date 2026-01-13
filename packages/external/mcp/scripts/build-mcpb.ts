#!/usr/bin/env npx tsx
/**
 * Build the .mcpb bundle for Claude Desktop installation.
 *
 * This script:
 * 1. Builds the server with all dependencies bundled (dist-bundle/)
 * 2. Creates the bundle/ directory structure for mcpb
 * 3. Runs mcpb pack to create the .mcpb file
 */

import { execSync } from 'child_process';
import {
  cpSync,
  mkdirSync,
  rmSync,
  readFileSync,
  writeFileSync,
  existsSync,
} from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function run(cmd: string, cwd = ROOT) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

function main() {
  console.log('Building .mcpb bundle for Claude Desktop...\n');

  // Clean previous build artifacts
  const bundleDir = join(ROOT, 'bundle');
  rmSync(bundleDir, { recursive: true, force: true });
  mkdirSync(bundleDir, { recursive: true });

  // Build the server with dependencies bundled (tsup creates dist-bundle/)
  console.log('1. Building server bundle with all dependencies...');
  run('bun run build');

  // Create server directory in bundle
  const serverDir = join(bundleDir, 'server');
  mkdirSync(serverDir, { recursive: true });

  // Copy the bundled dist-bundle/index.cjs to server/index.cjs
  cpSync(join(ROOT, 'dist-bundle', 'index.cjs'), join(serverDir, 'index.cjs'));

  // Copy manifest.json to bundle root
  cpSync(join(ROOT, 'manifest.json'), join(bundleDir, 'manifest.json'));

  // Copy icon if it exists
  const iconSrc = join(ROOT, 'icon.png');
  if (existsSync(iconSrc)) {
    cpSync(iconSrc, join(bundleDir, 'icon.png'));
  } else {
    console.log('   Warning: icon.png not found, skipping icon');
  }

  // Update version in manifest from package.json
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8')) as {
    version: string;
  };
  const manifest = JSON.parse(
    readFileSync(join(bundleDir, 'manifest.json'), 'utf-8')
  ) as { version: string };
  manifest.version = pkg.version;
  writeFileSync(
    join(bundleDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log(`   Version: ${pkg.version}`);

  // Pack using mcpb CLI
  console.log('\n2. Packing .mcpb bundle...');
  const outputFile = join(ROOT, 'x402scan.mcpb');
  rmSync(outputFile, { force: true });

  run(`npx -y @anthropic-ai/mcpb pack ${bundleDir} ${outputFile}`);

  // Clean up bundle directory
  rmSync(bundleDir, { recursive: true, force: true });

  console.log(`\n✅ Created: x402scan.mcpb`);
  console.log(
    `\nTo install in Claude Desktop, double-click the .mcpb file or use:`
  );
  console.log(`  open x402scan.mcpb`);
}

try {
  main();
} catch (err) {
  console.error('Error:', err);
  process.exit(1);
}
