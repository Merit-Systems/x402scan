import chalk from 'chalk';

import { getOutputFormat, isQuiet } from './format';
import {
  ExitCode,
  errorCodeToExitCode,
  type CliErrorDetails,
  type CliErrorResponse,
  type CliResponse,
  type CliSuccessResponse,
  type ErrorCode,
  type OutputFormat,
  type ResponseMetadata,
} from './types';

import type { JsonObject } from '@/shared/neverthrow/json/types';
import type { BaseError, Err } from '@x402scan/neverthrow/types';

/**
 * Output flags that can be passed to commands
 */
export interface OutputFlags {
  format?: string;
  quiet?: boolean;
  verbose?: boolean;
}

/**
 * Create a success response
 */
export function successResponse(
  data: JsonObject | string,
  metadata?: ResponseMetadata
): CliSuccessResponse {
  return {
    success: true,
    data,
    ...(metadata ? { metadata } : {}),
  };
}

/**
 * Create an error response
 */
export function errorResponse(error: CliErrorDetails): CliErrorResponse {
  return {
    success: false,
    error,
  };
}

/**
 * Convert a neverthrow error to a CLI error response
 */
export function fromNeverthrowError(
  err: Err<unknown, BaseError<string>>,
  codeOverride?: ErrorCode
): CliErrorResponse {
  const { error } = err;
  const code = codeOverride ?? mapCauseToErrorCode(error.cause);

  return errorResponse({
    code,
    message: error.message,
    surface: error.surface,
    cause: error.cause,
  });
}

/**
 * Map error cause to error code
 */
function mapCauseToErrorCode(cause: string): ErrorCode {
  switch (cause) {
    case 'network':
      return 'NETWORK_ERROR';
    case 'http':
      return 'HTTP_ERROR';
    case 'parse':
      return 'PARSE_ERROR';
    case 'insufficient_balance':
      return 'INSUFFICIENT_BALANCE';
    case 'payment_failed':
    case 'payment_already_attempted':
      return 'PAYMENT_FAILED';
    case 'invalid_input':
    case 'validation':
      return 'INVALID_INPUT';
    case 'wallet':
    case 'file_not_readable':
      return 'WALLET_ERROR';
    default:
      return 'GENERAL_ERROR';
  }
}

/**
 * Format response as JSON string
 */
function formatJson(response: CliResponse): string {
  return JSON.stringify(response, null, 2);
}

/**
 * Format response as pretty output for TTY
 */
function formatPretty(response: CliResponse): string {
  if (response.success) {
    const lines: string[] = [];

    // Data
    if (typeof response.data === 'string') {
      lines.push(response.data);
    } else {
      lines.push(JSON.stringify(response.data, null, 2));
    }

    // Metadata
    if (response.metadata) {
      lines.push('');
      if (response.metadata.price) {
        lines.push(chalk.dim(`Price: ${response.metadata.price}`));
      }
      if (response.metadata.payment) {
        const { success, transactionHash } = response.metadata.payment;
        lines.push(
          chalk.dim(
            `Payment: ${success ? chalk.green('✓') : chalk.red('✗')}${transactionHash ? ` (${transactionHash.slice(0, 10)}...)` : ''}`
          )
        );
      }
    }

    return lines.join('\n');
  } else {
    const { error } = response;
    const lines = [
      chalk.red(`Error: ${error.message}`),
      chalk.dim(`Code: ${error.code}`),
    ];

    if (error.surface) {
      lines.push(chalk.dim(`Surface: ${error.surface}`));
    }
    if (error.cause) {
      lines.push(chalk.dim(`Cause: ${error.cause}`));
    }

    return lines.join('\n');
  }
}

/**
 * Output a response to stdout and exit with appropriate code
 */
export function outputAndExit(
  response: CliResponse,
  flags: OutputFlags = {}
): never {
  const format = getOutputFormat(flags.format);
  const quiet = isQuiet(flags.quiet);

  output(response, format, quiet);

  const exitCode = response.success
    ? ExitCode.Success
    : errorCodeToExitCode[response.error.code];

  process.exit(exitCode);
}

/**
 * Output a response to stdout without exiting
 */
function output(
  response: CliResponse,
  format: OutputFormat = 'json',
  quiet = false
): void {
  const formatted =
    format === 'json' ? formatJson(response) : formatPretty(response);

  // Always output to stdout (machine-readable)
  console.log(formatted);

  // Optionally suppress stderr output
  if (!quiet && !response.success && format === 'pretty') {
    // Additional debug info could go to stderr
  }
}
