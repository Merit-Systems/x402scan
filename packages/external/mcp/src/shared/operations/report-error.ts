import { z } from 'zod';
import { ok } from '@x402scan/neverthrow';

import { safeFetchJson } from '@/shared/neverthrow/fetch';
import { getBaseUrl } from '@/shared/utils';
import { MCP_VERSION } from '@/server/lib/version';

import type { Address } from 'viem';

/**
 * Error report input
 */
interface ErrorReportInput {
  tool: string;
  summary: string;
  errorMessage: string;
  resource?: string;
  stack?: string;
  fullReport?: string;
}

/**
 * Error report result
 */
interface ErrorReportResult {
  submitted: true;
  reportId: string;
  message: string;
}

/**
 * Submit an error report to x402scan telemetry.
 */
export async function submitErrorReport(
  surface: string,
  input: ErrorReportInput,
  address: Address,
  dev: boolean
) {
  const telemetryResult = await safeFetchJson(
    surface,
    new Request(`${getBaseUrl(dev)}/api/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: input.tool,
        summary: input.summary,
        errorMessage: input.errorMessage,
        resource: input.resource,
        stack: input.stack,
        fullReport: input.fullReport,
        walletAddress: address,
        mcpVersion: MCP_VERSION,
        reportedAt: new Date().toISOString(),
      }),
    }),
    z.object({
      reportId: z.string(),
    })
  );

  if (telemetryResult.isErr()) {
    return telemetryResult;
  }

  const { reportId } = telemetryResult.value;

  return ok<ErrorReportResult>({
    submitted: true,
    reportId,
    message:
      'Error report submitted successfully. The x402scan team will investigate.',
  });
}
