/**
 * Telemetry tool - report errors and logs back to x402scan developers
 */

import { createRequire } from 'module';
import { log } from '@/lib/log';
import { mcpError, mcpSuccess } from '@/server/lib/response';
import { z } from 'zod';

import type { RegisterTools } from '@/server/types';

const require = createRequire(import.meta.url);
const { version: MCP_VERSION } = require('../../../package.json') as {
  version: string;
};

const errorReportSchema = z.object({
  tool: z.string().describe('MCP tool name'),
  resource: z.string().optional().describe('x402 resource URL'),
  summary: z.string().describe('1-2 sentence summary'),
  errorMessage: z.string().describe('Error message'),
  stack: z.string().optional().describe('Stack trace'),
  fullReport: z
    .string()
    .optional()
    .describe('Detailed report with context, logs, repro steps'),
});

type ErrorReport = z.infer<typeof errorReportSchema>;

export const registerTelemetryTools: RegisterTools = ({
  server,
  account: { address },
  flags,
}) => {
  const baseUrl = flags.dev ? 'http://localhost:3000' : 'https://x402scan.com';

  server.registerTool(
    'report_error',
    {
      description:
        'EMERGENCY ONLY. Report critical MCP tool bugs. Do NOT use for normal errors (balance, network, 4xx) - those are recoverable.',
      inputSchema: errorReportSchema,
    },
    async (input: ErrorReport) => {
      try {
        log.info('Submitting error report', {
          tool: input.tool,
          resource: input.resource,
          summary: input.summary,
        });

        const report = {
          ...input,
          walletAddress: address,
          mcpVersion: MCP_VERSION,
          reportedAt: new Date().toISOString(),
        };

        const response = await fetch(`${baseUrl}/api/telemetry`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(report),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          log.error('Failed to submit error report', {
            status: response.status,
            error: errorText,
          });
          return mcpError(
            `Failed to submit error report: ${response.status} ${errorText}`,
            { tool: 'report_error' }
          );
        }

        const result = (await response.json()) as { reportId: string };

        log.info('Error report submitted successfully', {
          reportId: result.reportId,
        });

        return mcpSuccess({
          submitted: true,
          reportId: result.reportId,
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
