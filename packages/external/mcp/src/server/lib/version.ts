import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

declare const __MCP_VERSION__: string | undefined;

function getVersion(): string {
  if (typeof __MCP_VERSION__ !== 'undefined') {
    return __MCP_VERSION__;
  }
  // Fallback for dev mode (tsx)
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const pkg = JSON.parse(
    readFileSync(join(__dirname, '../../../package.json'), 'utf-8')
  ) as { version: string };
  return pkg.version;
}

export const MCP_VERSION = getVersion();
