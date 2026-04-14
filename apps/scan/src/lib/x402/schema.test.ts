import { describe, it, expect } from 'vitest';
import { extractFieldsFromSchema } from './schema';
import { Methods } from '@/types/x402';

describe('extractFieldsFromSchema - protocol header filtering', () => {
  it('filters out x402 protocol headers from headerFields', () => {
    const inputSchema = {
      method: 'GET',
      headerFields: {
        Authorization: { type: 'string', required: true },
        'X-Payment': {
          type: 'string',
          description: 'Base64-encoded x402 payment data',
        },
        'PAYMENT-SIGNATURE': { type: 'string' },
        'X-Custom-Header': { type: 'string', required: true },
      },
    };

    const fields = extractFieldsFromSchema(inputSchema, Methods.GET, 'header');
    const names = fields.map(f => f.name);

    expect(names).toEqual(['X-Custom-Header']);
    expect(names).not.toContain('Authorization');
    expect(names).not.toContain('X-Payment');
    expect(names).not.toContain('PAYMENT-SIGNATURE');
  });

  it('filters protocol headers case-insensitively', () => {
    const inputSchema = {
      method: 'POST',
      headerFields: {
        authorization: { type: 'string' },
        'x-payment': { type: 'string' },
        'payment-signature': { type: 'string' },
        'sign-in-with-x': { type: 'string' },
        'X-Api-Key': { type: 'string' },
      },
    };

    const fields = extractFieldsFromSchema(inputSchema, Methods.POST, 'header');
    const names = fields.map(f => f.name);

    expect(names).toEqual(['X-Api-Key']);
  });

  it('returns empty array when all headers are protocol headers', () => {
    const inputSchema = {
      method: 'POST',
      headerFields: {
        Authorization: { type: 'string' },
        'X-Payment': { type: 'string' },
      },
    };

    const fields = extractFieldsFromSchema(inputSchema, Methods.POST, 'header');
    expect(fields).toEqual([]);
  });

  it('does not filter non-header fields', () => {
    const inputSchema = {
      method: 'GET',
      queryParams: {
        authorization: { type: 'string', description: 'some query param' },
      },
    };

    const fields = extractFieldsFromSchema(inputSchema, Methods.GET, 'query');
    expect(fields).toHaveLength(1);
    expect(fields[0]!.name).toBe('authorization');
  });
});
