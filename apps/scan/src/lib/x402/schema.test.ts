import { describe, it, expect } from 'vitest';
import { extractFieldsFromSchema, reconstructNestedObject } from './schema';
import { Methods } from '@/types/x402';
import type { InputSchema } from '@/lib/x402';

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

describe('extractFieldsFromSchema - nested object expansion', () => {
  it('expands object fields with properties into dot-notation sub-fields', () => {
    // Runtime schemas may include a `body` key with JSON Schema content
    const inputSchema = {
      type: 'http' as const,
      method: 'POST' as const,
      body: {
        type: 'object',
        properties: {
          date: {
            type: 'object',
            title: 'DateOnlyRange',
            properties: {
              from: {
                type: 'string',
                description: 'Start date in YYYY-MM-DD format',
              },
              to: {
                type: 'string',
                description: 'End date in YYYY-MM-DD format',
              },
            },
          },
        },
      },
    } as unknown as InputSchema;

    const fields = extractFieldsFromSchema(inputSchema, Methods.POST, 'body');
    const names = fields.map(f => f.name);

    expect(names).toContain('date.from');
    expect(names).toContain('date.to');
    expect(names).not.toContain('date');
  });

  it('expands inferred objects (properties present, no explicit type)', () => {
    const inputSchema = {
      type: 'http' as const,
      method: 'POST' as const,
      body: {
        type: 'object',
        properties: {
          filters: {
            properties: {
              min: { type: 'number', description: 'Minimum value' },
              max: { type: 'number', description: 'Maximum value' },
            },
          },
        },
      },
    } as unknown as InputSchema;

    const fields = extractFieldsFromSchema(inputSchema, Methods.POST, 'body');
    const names = fields.map(f => f.name);

    expect(names).toContain('filters.min');
    expect(names).toContain('filters.max');
    expect(names).not.toContain('filters');
  });

  it('preserves required flags on nested fields', () => {
    const inputSchema = {
      type: 'http' as const,
      method: 'POST' as const,
      body: {
        type: 'object',
        properties: {
          pagination: {
            type: 'object',
            required: ['page'],
            properties: {
              page: { type: 'integer', description: 'Page number' },
              per_page: { type: 'integer', description: 'Results per page' },
            },
          },
        },
      },
    } as unknown as InputSchema;

    const fields = extractFieldsFromSchema(inputSchema, Methods.POST, 'body');
    const pageField = fields.find(f => f.name === 'pagination.page');
    const perPageField = fields.find(f => f.name === 'pagination.per_page');

    expect(pageField?.required).toBe(true);
    expect(perPageField?.required).toBe(false);
  });
});

describe('reconstructNestedObject', () => {
  it('reconstructs dot-notation keys into nested objects', () => {
    const result = reconstructNestedObject({
      'date.from': '2026-04-10',
      'date.to': '2026-04-14',
    });

    expect(result).toEqual({
      date: {
        from: '2026-04-10',
        to: '2026-04-14',
      },
    });
  });

  it('handles mix of flat and nested keys', () => {
    const result = reconstructNestedObject({
      query: 'test',
      'pagination.page': 1,
      'pagination.per_page': 10,
    });

    expect(result).toEqual({
      query: 'test',
      pagination: {
        page: 1,
        per_page: 10,
      },
    });
  });

  it('handles deeply nested keys', () => {
    const result = reconstructNestedObject({
      'filters.total_pnl.min': 100,
      'filters.total_pnl.max': 1000,
    });

    expect(result).toEqual({
      filters: {
        total_pnl: {
          min: 100,
          max: 1000,
        },
      },
    });
  });

  it('nests arrays under dot-notation keys', () => {
    const result = reconstructNestedObject({
      order_by: [{ field: 'pnl', direction: 'desc' }],
      'filters.tags': ['alpha', 'beta'],
    });

    expect(result).toEqual({
      order_by: [{ field: 'pnl', direction: 'desc' }],
      filters: {
        tags: ['alpha', 'beta'],
      },
    });
  });
});
