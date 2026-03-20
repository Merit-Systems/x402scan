import { describe, expect, it } from 'vitest';

import { Methods } from '@/types/x402';
import { extractFieldsFromSchema } from './schema';

import type { InputSchema } from './index';

describe('extractFieldsFromSchema defaults', () => {
  it('coerces numeric and boolean defaults to strings', () => {
    const inputSchema = {
      body: {
        type: 'object',
        properties: {
          count: {
            type: 'number',
            default: 3,
          },
          enabled: {
            type: 'boolean',
            default: false,
          },
          label: {
            type: 'string',
            default: 'ready',
          },
        },
      },
    } as InputSchema;

    const fields = extractFieldsFromSchema(inputSchema, Methods.POST, 'body');

    expect(fields.find(field => field.name === 'count')?.default).toBe('3');
    expect(fields.find(field => field.name === 'enabled')?.default).toBe(
      'false'
    );
    expect(fields.find(field => field.name === 'label')?.default).toBe('ready');
  });
});
