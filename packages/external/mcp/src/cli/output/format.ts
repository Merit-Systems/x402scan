import type { OutputFormat } from './types';

/**
 * Detect if stdout is a TTY (interactive terminal)
 */
export function isTTY(): boolean {
  return process.stdout.isTTY ?? false;
}

/**
 * Determine output format based on flags and environment
 * - Explicit --format flag takes precedence
 * - Non-TTY (piped) defaults to json
 * - TTY (interactive) defaults to pretty
 */
export function getOutputFormat(formatFlag?: string): OutputFormat {
  if (formatFlag === 'json' || formatFlag === 'pretty') {
    return formatFlag;
  }
  return isTTY() ? 'pretty' : 'json';
}

/**
 * Check if verbose output is enabled
 */
export function isVerbose(verboseFlag?: boolean): boolean {
  return verboseFlag ?? process.env.X402_DEBUG === 'true';
}

/**
 * Check if quiet mode is enabled (suppress stderr)
 */
export function isQuiet(quietFlag?: boolean): boolean {
  return quietFlag ?? false;
}
