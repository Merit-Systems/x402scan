import { safeStringifyJson } from '@/shared/neverthrow/json';

import { mcpErrorJson } from './error';

import type { JsonObject } from '@/shared/neverthrow/json/types';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ParsedResponse } from '@/shared/neverthrow/fetch/types';
import { parsedResponseToToolContentPart } from './lib';

const buildMcpSuccess = (
  content: CallToolResult['content']
): CallToolResult => {
  return {
    content,
  };
};

export const mcpSuccessJson = (data: JsonObject): CallToolResult => {
  return safeStringifyJson('mcp-success-text', data).match(
    success => buildMcpSuccess([{ type: 'text' as const, text: success }]),
    error => mcpErrorJson(error)
  );
};

export const mcpSuccessStructuredJson = (data: JsonObject): CallToolResult => {
  return safeStringifyJson('mcp-success-structured', data).match(
    success => ({
      content: [{ type: 'text' as const, text: success }],
      structuredContent: data,
    }),
    error => mcpErrorJson(error)
  );
};

export const mcpSuccessResponse = (
  data: ParsedResponse,
  extra?: JsonObject
): CallToolResult => {
  const parsedExtra = extra
    ? safeStringifyJson('mcp-success-extra', extra).match(
        success => success,
        () => undefined
      )
    : undefined;

  return buildMcpSuccess([
    parsedResponseToToolContentPart(data),
    ...(parsedExtra ? [{ type: 'text' as const, text: parsedExtra }] : []),
  ]);
};
