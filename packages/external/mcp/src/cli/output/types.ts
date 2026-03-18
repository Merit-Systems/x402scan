import type { JsonObject } from '@/shared/neverthrow/json/types';

/**
 * Exit codes for CLI commands
 * Allows agents to programmatically determine error types
 */
export enum ExitCode {
  Success = 0,
  GeneralError = 1,
  InsufficientBalance = 2,
  NetworkError = 3,
  PaymentFailed = 4,
  InvalidInput = 5,
}

/**
 * Error codes for structured error responses
 */
export type ErrorCode =
  | 'GENERAL_ERROR'
  | 'INSUFFICIENT_BALANCE'
  | 'NETWORK_ERROR'
  | 'PAYMENT_FAILED'
  | 'INVALID_INPUT'
  | 'WALLET_ERROR'
  | 'PARSE_ERROR'
  | 'HTTP_ERROR'
  | 'X402_ERROR';

/**
 * Maps error codes to exit codes
 */
export const errorCodeToExitCode: Record<ErrorCode, ExitCode> = {
  GENERAL_ERROR: ExitCode.GeneralError,
  INSUFFICIENT_BALANCE: ExitCode.InsufficientBalance,
  NETWORK_ERROR: ExitCode.NetworkError,
  PAYMENT_FAILED: ExitCode.PaymentFailed,
  INVALID_INPUT: ExitCode.InvalidInput,
  WALLET_ERROR: ExitCode.GeneralError,
  PARSE_ERROR: ExitCode.InvalidInput,
  HTTP_ERROR: ExitCode.NetworkError,
  X402_ERROR: ExitCode.PaymentFailed,
};

/**
 * Payment metadata included in successful paid responses
 */
export interface PaymentMetadata {
  success: boolean;
  transactionHash?: string;
}

/**
 * Metadata included in CLI responses
 */
export interface ResponseMetadata {
  price?: string;
  payment?: PaymentMetadata;
}

/**
 * Successful CLI response
 */
export interface CliSuccessResponse {
  success: true;
  data: JsonObject | string;
  metadata?: ResponseMetadata;
}

/**
 * Error details in CLI response
 */
export interface CliErrorDetails {
  code: ErrorCode;
  message: string;
  surface?: string;
  cause?: string;
  details?: JsonObject;
}

/**
 * Failed CLI response
 */
export interface CliErrorResponse {
  success: false;
  error: CliErrorDetails;
}

/**
 * Union type for all CLI responses
 */
export type CliResponse = CliSuccessResponse | CliErrorResponse;

/**
 * Output format options
 */
export type OutputFormat = 'json' | 'pretty';
