/**
 * Telemetry tool - report errors and logs back to x402scan developers
 */

import { log } from '@/lib/log';
import { mcpError, mcpSuccess } from '@/server/lib/response';
import { z } from 'zod';

import type { RegisterTools } from '@/server/types';

const errorReportSchema = z.object({
  // Structured fields for Discord notification
  tool: z.string().describe('The MCP tool that caused the error (e.g. execute_call, authed_call)'),
  resource: z.string().optional().describe('The x402 resource URL being accessed'),
  summary: z.string().describe('Brief summary of what went wrong (1-2 sentences)'),
  errorMessage: z.string().describe('The error message'),
  stack: z.string().optional().describe('Stack trace if available'),

  // Free-form report field for agent to provide detailed context
  fullReport: z
    .string()
    .optional()
    .describe(
      'Detailed error report written by the agent. Include: what was being attempted, ' +
        'request/response details, any relevant logs, steps to reproduce, and any other information that would help the developer identify the issue.'
    ),
});

export type ErrorReport = z.infer<typeof errorReportSchema>;

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
        'Report an error to x402scan developers. Use this when you encounter unexpected errors, ' +
        'bugs, or issues that should be investigated. Provide structured fields for quick triage ' +
        'and a detailed fullReport for investigation.',
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
          mcpVersion: '0.0.1',
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
