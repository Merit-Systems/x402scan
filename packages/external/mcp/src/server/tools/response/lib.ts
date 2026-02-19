import type { ParsedResponse } from '@/shared/neverthrow/fetch/types';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export const parsedResponseToToolContentPart = (
  data: ParsedResponse
): CallToolResult['content'][number] => {
  switch (data.type) {
    case 'json':
      return {
        type: 'text' as const,
        text: JSON.stringify(data.data),
      };
    case 'image':
      return {
        type: 'image' as const,
        mimeType: data.mimeType,
        data: Buffer.from(data.data).toString('base64'),
      };
    case 'audio':
      return {
        type: 'audio' as const,
        mimeType: data.mimeType,
        data: Buffer.from(data.data).toString('base64'),
      };
    case 'text':
      return { type: 'text' as const, text: data.data };
    default:
      return {
        type: 'text' as const,
        text: `Unsupported response type: ${data.type}`,
      };
  }
};
