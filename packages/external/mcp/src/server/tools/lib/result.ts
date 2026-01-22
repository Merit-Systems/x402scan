import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { BaseError, Error } from '@x402scan/neverthrow/types';

const mcpSuccess = (content: CallToolResult['content']): CallToolResult => {
  return {
    content,
  };
};

export const mcpError = <E extends BaseError>(
  error: Error<E>
): CallToolResult => {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(error, null, 2),
      },
    ],
    isError: true as const,
  };
};

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;

interface JsonObject {
  [key: string]: JsonValue;
}

type JsonArray = JsonValue[];

const textContent = (data: JsonObject): CallToolResult['content'][number] => {
  return { type: 'text' as const, text: JSON.stringify(data, null, 2) };
};

export const mcpTextSuccess = (data: JsonObject): CallToolResult => {
  return mcpSuccess([textContent(data)]);
};
