#!/usr/bin/env npx tsx

import { resultFromPromise } from '@x402scan/neverthrow';
import { execSync } from 'child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SCAN_PUBLIC_DIR = join(ROOT, '..', '..', '..', 'apps', 'scan', 'public');

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

  run('pnpm install');

  // Build the server with dependencies bundled (tsup creates dist/bundle/)
  console.log('1. Building server bundle with all dependencies...');
  run('pnpm build');

  // Create server directory in bundle
  const serverDir = join(bundleDir, 'server');
  mkdirSync(serverDir, { recursive: true });

  // Copy the bundled dist/bundle/index.cjs to server/index.cjs
  cpSync(
    join(ROOT, 'dist', 'cjs', 'run-server.cjs'),
    join(serverDir, 'index.cjs')
  );

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

  // If the file doesn't exist, create it
  const scanMcpbPath = join(SCAN_PUBLIC_DIR, 'x402scan.mcpb');
  if (!existsSync(scanMcpbPath)) {
    writeFileSync(scanMcpbPath, '');
    console.log('   Created empty x402scan.mcpb in SCAN_PUBLIC_DIR.');
  }
  cpSync(outputFile, scanMcpbPath);

  // Clean up bundle directory
  rmSync(bundleDir, { recursive: true, force: true });

  console.log(`\n✅ Created: x402scan.mcpb`);
  console.log(
    `\nTo install in Claude Desktop, double-click the .mcpb file or use:`
  );
  console.log(`  open x402scan.mcpb`);
}

resultFromPromise('build-mcpb', Promise.resolve(main()), err => ({
  type: 'error',
  message: 'Error building MCPB bundle',
  error: err,
}));
