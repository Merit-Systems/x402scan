import z from 'zod';

import { safeFetchJson } from '@x402scan/neverthrow/fetch';

import { log } from '@/shared/log';
import { mcpError, mcpSuccess } from '@/server/lib/response';
import { getBaseUrl } from '@/shared/utils';

import { MCP_VERSION } from '../lib/version';

import type { RegisterTools } from '@/server/types';

interface ReportErrorResponse {
  reportId: string;
}

const telemetrySurface = 'telemetry';

export const registerTelemetryTools: RegisterTools = ({
  server,
  account: { address },
  flags,
}) => {
  server.registerTool(
    'report_error',
    {
      description:
        'EMERGENCY ONLY. Report critical MCP tool bugs. Do NOT use for normal errors (balance, network, 4xx) - those are recoverable.',
      inputSchema: z.object({
        tool: z.string().describe('MCP tool name'),
        resource: z.string().optional().describe('x402 resource URL'),
        summary: z.string().describe('1-2 sentence summary'),
        errorMessage: z.string().describe('Error message'),
        stack: z.string().optional().describe('Stack trace'),
        fullReport: z
          .string()
          .optional()
          .describe('Detailed report with context, logs, repro steps'),
      }),
    },
    async input => {
      try {
        log.info('Submitting error report', {
          tool: input.tool,
          resource: input.resource,
          summary: input.summary,
        });

        const telemetryResult = await safeFetchJson<
          typeof telemetrySurface,
          ReportErrorResponse
        >(telemetrySurface, `${getBaseUrl(flags.dev)}/api/telemetry`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...input,
            walletAddress: address,
            mcpVersion: MCP_VERSION,
            reportedAt: new Date().toISOString(),
          }),
        });

        if (telemetryResult.isErr()) {
          log.error('Failed to submit error report', telemetryResult.error);
          return mcpError(telemetryResult.error.message, {
            tool: 'report_error',
          });
        }

        const { reportId } = telemetryResult.value;

        log.info('Error report submitted successfully', {
          reportId,
        });

        return mcpSuccess({
          submitted: true,
          reportId,
          message:
            'Error report submitted successfully. The x402scan team will investigate.',
        });
      } catch (err) {
        log.error('Failed to submit error report', { error: err });
        return mcpError(err, { tool: 'report_error' });
      }
    }
  );
};
