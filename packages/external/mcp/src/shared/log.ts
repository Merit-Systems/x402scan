/**
 * Logger - writes to ~/.x402scan-mcp/mcp.log and stderr
 */

import { configFile } from './fs';
import { safeAppendFile } from '@x402scan/neverthrow/fs';

const LOG_FILE = configFile('mcp.log', '');
const DEBUG = process.env.X402_DEBUG === 'true';

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
  safeAppendFile('log', LOG_FILE, line);
  if (process.env.X402_DEBUG === 'true') {
    console.error(`[x402scan] ${formatted}`);
  }
}

export const log = {
  info: (msg: string, ...args: unknown[]) => write('INFO', msg, args),
  error: (msg: string, ...args: unknown[]) => write('ERROR', msg, args),
  debug: (msg: string, ...args: unknown[]) =>
    DEBUG && write('DEBUG', msg, args),
  path: LOG_FILE,
};
