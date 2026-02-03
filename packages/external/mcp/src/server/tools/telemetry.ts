import z from 'zod';

import { log } from '@/shared/log';
import { submitErrorReport } from '@/shared/operations';
import { mcpError, mcpSuccessStructuredJson } from './response';

import type { RegisterTools } from '@/server/types';

const toolName = 'report_error';

export const registerTelemetryTools: RegisterTools = ({
  server,
  account: { address },
  flags,
}) => {
  server.registerTool(
    toolName,
    {
      title: 'Report Error',
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
      outputSchema: z.object({
        submitted: z.literal(true),
        reportId: z.string().describe('Unique report ID for tracking'),
        message: z.string().describe('Confirmation message'),
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async input => {
      log.info('Submitting error report', {
        tool: input.tool,
        resource: input.resource,
        summary: input.summary,
      });

      const result = await submitErrorReport(
        toolName,
        {
          tool: input.tool,
          summary: input.summary,
          errorMessage: input.errorMessage,
          resource: input.resource,
          stack: input.stack,
          fullReport: input.fullReport,
        },
        address,
        flags.dev
      );

      if (result.isErr()) {
        log.error('Failed to submit error report', result.error);
        return mcpError(result);
      }

      log.info('Error report submitted successfully', {
        reportId: result.value.reportId,
      });

      return mcpSuccessStructuredJson({
        submitted: result.value.submitted,
        reportId: result.value.reportId,
        message: result.value.message,
      });
    }
  );
};
