/**
 * Logger - writes to ~/.x402scan-mcp/mcp.log and stderr
 */

import { appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';

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

export interface ConsoleLog {
  type: 'info' | 'error' | 'success' | 'log';
  message: string;
}

export const formatConsoleLog = (log: ConsoleLog, prefix?: string) => {
  const text = prefix ? `${prefix} ${log.message}` : log.message;
  switch (log.type) {
    case 'info':
      return chalk.blue(text);
    case 'error':
      return chalk.red(text);
    case 'success':
      return chalk.green(text);
    case 'log':
      return text;
  }
};
