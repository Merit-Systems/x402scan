import { safeStringifyJson } from '@/shared/neverthrow/json';

import { parsedResponseToToolContentPart } from './lib';
import { isFetchError, safeParseResponse } from '@/shared/neverthrow/fetch';

import type { JsonObject } from '@/shared/neverthrow/json/types';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { BaseError, Error } from '@x402scan/neverthrow/types';
import type { BaseX402Error } from '@/shared/neverthrow/x402/types';
import type {
  BaseFetchError,
  FetchError,
} from '@/shared/neverthrow/fetch/types';

const buildMcpError = (content: CallToolResult['content']): CallToolResult => {
  return {
    content,
    isError: true as const,
  };
};

export const mcpErrorJson = (error: JsonObject): CallToolResult => {
  return safeStringifyJson('mcp-error-json', error).match(
    success => buildMcpError([{ type: 'text' as const, text: success }]),
    error =>
      buildMcpError([
        { type: 'text' as const, text: JSON.stringify(error, null, 2) },
      ])
  );
};

export const mcpErrorFetch = async (
  error: FetchError
): Promise<CallToolResult> => {
  switch (error.cause) {
    case 'network':
    case 'parse':
      return mcpErrorJson({ ...error });
    case 'http':
      const { response, ...rest } = error;
      const parseResponseResult = await safeParseResponse(
        'mcp-error-fetch-parse-response',
        response
      );
      return buildMcpError([
        { type: 'text' as const, text: JSON.stringify(rest, null, 2) },
        ...parseResponseResult.match(
          success => [parsedResponseToToolContentPart(success)],
          () => []
        ),
      ]);
  }
};

export const mcpError = (
  error: Error<BaseX402Error | BaseFetchError | BaseError>
) => {
  if (isFetchError(error)) {
    return mcpErrorFetch(error);
  }
  return mcpErrorJson({ ...error });
};
