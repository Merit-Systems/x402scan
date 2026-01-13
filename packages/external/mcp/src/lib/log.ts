/**
 * Logger - writes to ~/.x402scan-mcp/mcp.log and stderr
 */

import { appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const LOG_DIR = join(homedir(), '.x402scan-mcp');
const LOG_FILE = join(LOG_DIR, 'mcp.log');
const DEBUG = process.env.X402_DEBUG === 'true';

try {
  mkdirSync(LOG_DIR, { recursive: true });
} catch {}

function format(args: unknown[]): string {
  return args
    .map(a =>
      typeof a === 'object' && a !== null ? JSON.stringify(a) : String(a)
    )
    .join(' ');
}

function write(level: string, msg: string, args: unknown[]): void {
  const formatted = args.length ? `${msg} ${format(args)}` : msg;
  const line = `[${new Date().toISOString()}] [${level}] ${formatted}\n`;
  try {
    appendFileSync(LOG_FILE, line);
  } catch {}
  console.error(`[x402scan] ${formatted}`);
}

export const log = {
  info: (msg: string, ...args: unknown[]) => write('INFO', msg, args),
  error: (msg: string, ...args: unknown[]) => write('ERROR', msg, args),
  debug: (msg: string, ...args: unknown[]) =>
    DEBUG && write('DEBUG', msg, args),
  path: LOG_FILE,
};
