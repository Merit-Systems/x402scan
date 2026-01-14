/**
 * MCP response helpers
 */

import { formatUnits, parseUnits } from 'viem';

export function mcpSuccess<T>(data: T) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
  };
}

export function mcpError(error: unknown, context?: Record<string, unknown>) {
  let message: string;
  let details: Record<string, unknown> | undefined;

  if (error instanceof Error) {
    message = error.message;
    if ('cause' in error && error.cause) {
      details = { cause: JSON.stringify(error.cause) };
    }
  } else if (typeof error === 'string') {
    message = error;
  } else {
    message = String(error);
  }

  const payload: Record<string, unknown> = { error: message };
  if (details) payload.details = details;
  if (context) payload.context = context;

  return {
    content: [
      { type: 'text' as const, text: JSON.stringify(payload, null, 2) },
    ],
    isError: true as const,
  };
}

/** Format USDC amount from raw units (6 decimals) to USD string */
export function formatUSDC(amount: bigint) {
  return Number(formatUnits(amount, 6)).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: 'currency',
    currency: 'USD',
  });
}

export function parseUSDC(amount: string) {
  return parseUnits(amount, 6);
}
