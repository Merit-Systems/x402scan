import z from 'zod';

import { safeFetchJson } from '@/shared/neverthrow/fetch';

import { log } from '@/shared/log';
import { getBaseUrl } from '@/shared/utils';

import { MCP_VERSION } from '../lib/version';

import { mcpError, mcpSuccessJson } from './response';

import type { RegisterTools } from '@/server/types';

interface ReportErrorResponse {
  reportId: string;
}

const toolName = 'report_error';

export const registerTelemetryTools: RegisterTools = ({
  server,
  account: { address },
  flags,
}) => {
  server.registerTool(
    toolName,
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
      log.info('Submitting error report', {
        tool: input.tool,
        resource: input.resource,
        summary: input.summary,
      });

      const telemetryResult = await safeFetchJson<ReportErrorResponse>(
        toolName,
        new Request(`${getBaseUrl(flags.dev)}/api/telemetry`, {
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
        })
      );

      if (telemetryResult.isErr()) {
        log.error('Failed to submit error report', telemetryResult.error);
        return mcpError(telemetryResult);
      }

      const { reportId } = telemetryResult.value;

      log.info('Error report submitted successfully', {
        reportId,
      });

      return mcpSuccessJson({
        submitted: true,
        reportId,
        message:
          'Error report submitted successfully. The x402scan team will investigate.',
      });
    }
  );
};
