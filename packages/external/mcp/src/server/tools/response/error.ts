import { safeStringifyJson } from '@/shared/neverthrow/json';

import { parsedResponseToToolContentPart } from './lib';
import {
  fetchHttpErr,
  isFetchError,
  safeParseResponse,
} from '@/shared/neverthrow/fetch';

import type { JsonObject } from '@/shared/neverthrow/json/types';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { BaseError, Err } from '@x402scan/neverthrow/types';
import type { BaseX402Error } from '@/shared/neverthrow/x402/types';
import type { BaseFetchError } from '@/shared/neverthrow/fetch/types';

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
        { type: 'text' as const, text: JSON.stringify(error) },
      ])
  );
};

export const mcpError = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  err: Err<any, BaseX402Error | BaseFetchError | BaseError>
) => {
  const { error } = err;
  if (isFetchError(error)) {
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
          { type: 'text' as const, text: JSON.stringify(rest) },
          ...parseResponseResult.match(
            success => [parsedResponseToToolContentPart(success)],
            () => []
          ),
        ]);
    }
  }
  return mcpErrorJson({ ...error });
};

export const mcpErrorFetch = async (surface: string, response: Response) => {
  return mcpError(fetchHttpErr(surface, response));
};
