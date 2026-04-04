import { describe, it, expect } from 'vitest';
import { extractFieldsFromSchema } from './schema';
import { Methods } from '@/types/x402';

describe('extractFieldsFromSchema', () => {
  it('should extract string-typed query params', () => {
    const inputSchema = {
      method: 'GET',
      queryParams: {
        duration: { type: 'string', description: 'Time window' },
        include: { type: 'string' },
      },
    };

    const fields = extractFieldsFromSchema(inputSchema, Methods.GET, 'query');
    expect(fields).toHaveLength(2);
    expect(fields.find(f => f.name === 'duration')?.type).toBe('string');
    expect(fields.find(f => f.name === 'include')?.type).toBe('string');
  });

  it('should handle numeric example values in query params', () => {
    const inputSchema = {
      method: 'GET',
      queryParams: {
        page: 1,
        duration: '5m',
      },
    };

    const fields = extractFieldsFromSchema(inputSchema, Methods.GET, 'query');
    expect(fields).toHaveLength(2);

    const pageField = fields.find(f => f.name === 'page');
    expect(pageField).toBeDefined();
    expect(pageField?.type).toBe('integer');
    expect(pageField?.default).toBe('1');

    const durationField = fields.find(f => f.name === 'duration');
    expect(durationField).toBeDefined();
    expect(durationField?.type).toBe('5m');
  });

  it('should handle boolean example values in query params', () => {
    const inputSchema = {
      method: 'GET',
      queryParams: {
        include_gt_community_data: true,
        verbose: false,
      },
    };

    const fields = extractFieldsFromSchema(inputSchema, Methods.GET, 'query');
    expect(fields).toHaveLength(2);

    const boolField = fields.find(f => f.name === 'include_gt_community_data');
    expect(boolField).toBeDefined();
    expect(boolField?.type).toBe('boolean');
    expect(boolField?.default).toBe('true');
    expect(boolField?.enum).toEqual(['true', 'false']);

    const verboseField = fields.find(f => f.name === 'verbose');
    expect(verboseField?.default).toBe('false');
  });

  it('should handle float numeric values', () => {
    const inputSchema = {
      method: 'GET',
      queryParams: {
        threshold: 0.5,
      },
    };

    const fields = extractFieldsFromSchema(inputSchema, Methods.GET, 'query');
    const field = fields.find(f => f.name === 'threshold');
    expect(field?.type).toBe('number');
    expect(field?.default).toBe('0.5');
  });

  it('should handle mixed param types like CoinGecko trending pools', () => {
    const inputSchema = {
      method: 'GET',
      queryParams: {
        page: 1,
        duration: '5m',
        include_gt_community_data: true,
        include: 'base_token,quote_tokens,dex',
      },
    };

    const fields = extractFieldsFromSchema(inputSchema, Methods.GET, 'query');
    expect(fields).toHaveLength(4);
    expect(fields.map(f => f.name).sort()).toEqual([
      'duration',
      'include',
      'include_gt_community_data',
      'page',
    ]);
  });

  it('should preserve non-string defaults in schema objects', () => {
    const inputSchema = {
      method: 'GET',
      queryParams: {
        limit: { type: 'integer', default: 10 },
        active: { type: 'boolean', default: false },
      },
    };

    const fields = extractFieldsFromSchema(inputSchema, Methods.GET, 'query');
    expect(fields.find(f => f.name === 'limit')?.default).toBe('10');
    expect(fields.find(f => f.name === 'active')?.default).toBe('false');
  });
});
