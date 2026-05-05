import { describe, it, expect } from 'vitest';
import { extractFieldsFromSchema } from './schema';
import { Methods } from '@/types/x402';
import { normalizedAcceptSchema, type InputSchema } from '@/lib/x402';

function makeInputSchema(
  overrides: Partial<InputSchema> & { method: InputSchema['method'] }
): InputSchema {
  return { type: 'http', ...overrides };
}

describe('extractFieldsFromSchema - protocol header filtering', () => {
  it('filters out x402 protocol headers from headerFields', () => {
    const inputSchema = makeInputSchema({
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
    });

    const fields = extractFieldsFromSchema(inputSchema, Methods.GET, 'header');
    const names = fields.map(f => f.name);

    expect(names).toEqual(['X-Custom-Header']);
    expect(names).not.toContain('Authorization');
    expect(names).not.toContain('X-Payment');
    expect(names).not.toContain('PAYMENT-SIGNATURE');
  });

  it('filters protocol headers case-insensitively', () => {
    const inputSchema = makeInputSchema({
      method: 'POST',
      headerFields: {
        authorization: { type: 'string' },
        'x-payment': { type: 'string' },
        'payment-signature': { type: 'string' },
        'sign-in-with-x': { type: 'string' },
        'X-Api-Key': { type: 'string' },
      },
    });

    const fields = extractFieldsFromSchema(inputSchema, Methods.POST, 'header');
    const names = fields.map(f => f.name);

    expect(names).toEqual(['X-Api-Key']);
  });

  it('returns empty array when all headers are protocol headers', () => {
    const inputSchema = makeInputSchema({
      method: 'POST',
      headerFields: {
        Authorization: { type: 'string' },
        'X-Payment': { type: 'string' },
      },
    });

    const fields = extractFieldsFromSchema(inputSchema, Methods.POST, 'header');
    expect(fields).toEqual([]);
  });

  it('does not filter non-header fields', () => {
    const inputSchema = makeInputSchema({
      method: 'GET',
      queryParams: {
        authorization: { type: 'string', description: 'some query param' },
      },
    });

    const fields = extractFieldsFromSchema(inputSchema, Methods.GET, 'query');
    expect(fields).toHaveLength(1);
    expect(fields[0]!.name).toBe('authorization');
  });
});

describe('normalizedAcceptSchema', () => {
  it('accepts arbitrary non-empty x402 schemes', () => {
    const result = normalizedAcceptSchema.safeParse({
      scheme: 'upto',
      network: 'base',
      maxAmountRequired: '10000',
      payTo: '0x1234567890123456789012345678901234567890',
      asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      maxTimeoutSeconds: 60,
    });

    expect(result.success).toBe(true);
  });
});
