import { describe, it, expect } from 'vitest';
import { normalizeX402Fields } from '../utils';

describe('x402 Utils', () => {
  describe('normalizeX402Fields', () => {
    it('should return primitive values unchanged', () => {
      expect(normalizeX402Fields(null)).toBe(null);
      expect(normalizeX402Fields(undefined)).toBe(undefined);
      expect(normalizeX402Fields(42)).toBe(42);
      expect(normalizeX402Fields('test')).toBe('test');
      expect(normalizeX402Fields(true)).toBe(true);
    });

    it('should return arrays unchanged', () => {
      const arr = [1, 2, 3];
      expect(normalizeX402Fields(arr)).toBe(arr);
    });

    it('should convert snake_case keys to camelCase', () => {
      const input = {
        snake_case_field: 'value',
        another_field: 'test',
      };

      const result = normalizeX402Fields(input) as Record<string, unknown>;

      expect(result.snakeCaseField).toBe('value');
      expect(result.anotherField).toBe('test');
    });

    it('should handle already camelCase keys', () => {
      const input = {
        camelCaseField: 'value',
        normalKey: 'test',
      };

      const result = normalizeX402Fields(input) as Record<string, unknown>;

      expect(result.camelCaseField).toBe('value');
      expect(result.normalKey).toBe('test');
    });

    it('should normalize accepts array', () => {
      const input = {
        accepts: [
          {
            max_amount_required: 100,
            pay_to: '0xabc',
          },
        ],
      };

      const result = normalizeX402Fields(input) as Record<string, unknown>;
      const accepts = result.accepts as Array<Record<string, unknown>>;

      expect(accepts[0].maxAmountRequired).toBe(100);
      expect(accepts[0].payTo).toBe('0xabc');
    });

    it('should handle multiple accepts entries', () => {
      const input = {
        accepts: [
          { scheme: 'exact', max_timeout_seconds: 30 },
          { scheme: 'up_to', max_timeout_seconds: 60 },
        ],
      };

      const result = normalizeX402Fields(input) as Record<string, unknown>;
      const accepts = result.accepts as Array<Record<string, unknown>>;

      expect(accepts).toHaveLength(2);
      expect(accepts[0].maxTimeoutSeconds).toBe(30);
      expect(accepts[1].maxTimeoutSeconds).toBe(60);
    });

    it('should normalize outputSchema within accepts', () => {
      const input = {
        accepts: [
          {
            output_schema: {
              input: {
                query_params: {
                  user_id: { type: 'string' },
                },
              },
            },
          },
        ],
      };

      const result = normalizeX402Fields(input) as Record<string, unknown>;
      const accepts = result.accepts as Array<Record<string, unknown>>;
      const outputSchema = accepts[0].outputSchema as Record<string, unknown>;
      const inputSchema = outputSchema.input as Record<string, unknown>;

      expect(inputSchema.queryParams).toBeDefined();
      expect(inputSchema.queryParams).toEqual({
        user_id: { type: 'string' },
      });
    });

    it('should preserve API field names in query params', () => {
      const input = {
        accepts: [
          {
            output_schema: {
              input: {
                query_params: {
                  user_id: { type: 'string' },
                  sort_by: { type: 'string' },
                  created_at: { type: 'date' },
                },
              },
            },
          },
        ],
      };

      const result = normalizeX402Fields(input) as Record<string, unknown>;
      const accepts = result.accepts as Array<Record<string, unknown>>;
      const outputSchema = accepts[0].outputSchema as Record<string, unknown>;
      const inputSchema = outputSchema.input as Record<string, unknown>;
      const queryParams = inputSchema.queryParams as Record<string, unknown>;

      // Field names should be preserved as-is (snake_case)
      expect(queryParams.user_id).toBeDefined();
      expect(queryParams.sort_by).toBeDefined();
      expect(queryParams.created_at).toBeDefined();
    });

    it('should handle body_fields normalization', () => {
      const input = {
        accepts: [
          {
            output_schema: {
              input: {
                body_fields: {
                  name: { type: 'string' },
                  age: { type: 'number' },
                },
              },
            },
          },
        ],
      };

      const result = normalizeX402Fields(input) as Record<string, unknown>;
      const accepts = result.accepts as Array<Record<string, unknown>>;
      const outputSchema = accepts[0].outputSchema as Record<string, unknown>;
      const inputSchema = outputSchema.input as Record<string, unknown>;

      expect(inputSchema.bodyFields).toBeDefined();
      expect(inputSchema.bodyFields).toEqual({
        name: { type: 'string' },
        age: { type: 'number' },
      });
    });

    it('should handle header_fields normalization', () => {
      const input = {
        accepts: [
          {
            output_schema: {
              input: {
                header_fields: {
                  'X-API-Key': { type: 'string' },
                },
              },
            },
          },
        ],
      };

      const result = normalizeX402Fields(input) as Record<string, unknown>;
      const accepts = result.accepts as Array<Record<string, unknown>>;
      const outputSchema = accepts[0].outputSchema as Record<string, unknown>;
      const inputSchema = outputSchema.input as Record<string, unknown>;

      expect(inputSchema.headerFields).toBeDefined();
    });

    it('should handle body_type normalization', () => {
      const input = {
        accepts: [
          {
            output_schema: {
              input: {
                body_type: 'application/json',
              },
            },
          },
        ],
      };

      const result = normalizeX402Fields(input) as Record<string, unknown>;
      const accepts = result.accepts as Array<Record<string, unknown>>;
      const outputSchema = accepts[0].outputSchema as Record<string, unknown>;
      const inputSchema = outputSchema.input as Record<string, unknown>;

      expect(inputSchema.bodyType).toBe('application/json');
    });

    it('should handle legacy "query" field as queryParams', () => {
      const input = {
        accepts: [
          {
            output_schema: {
              input: {
                query: {
                  search: { type: 'string' },
                },
              },
            },
          },
        ],
      };

      const result = normalizeX402Fields(input) as Record<string, unknown>;
      const accepts = result.accepts as Array<Record<string, unknown>>;
      const outputSchema = accepts[0].outputSchema as Record<string, unknown>;
      const inputSchema = outputSchema.input as Record<string, unknown>;

      expect(inputSchema.queryParams).toBeDefined();
      expect(inputSchema.queryParams).toEqual({
        search: { type: 'string' },
      });
    });

    it('should handle legacy "body" field as bodyFields', () => {
      const input = {
        accepts: [
          {
            output_schema: {
              input: {
                body: {
                  data: { type: 'string' },
                },
              },
            },
          },
        ],
      };

      const result = normalizeX402Fields(input) as Record<string, unknown>;
      const accepts = result.accepts as Array<Record<string, unknown>>;
      const outputSchema = accepts[0].outputSchema as Record<string, unknown>;
      const inputSchema = outputSchema.input as Record<string, unknown>;

      expect(inputSchema.bodyFields).toBeDefined();
      expect(inputSchema.bodyFields).toEqual({
        data: { type: 'string' },
      });
    });

    it('should handle legacy "headers" field as headerFields', () => {
      const input = {
        accepts: [
          {
            output_schema: {
              input: {
                headers: {
                  Authorization: { type: 'string' },
                },
              },
            },
          },
        ],
      };

      const result = normalizeX402Fields(input) as Record<string, unknown>;
      const accepts = result.accepts as Array<Record<string, unknown>>;
      const outputSchema = accepts[0].outputSchema as Record<string, unknown>;
      const inputSchema = outputSchema.input as Record<string, unknown>;

      expect(inputSchema.headerFields).toBeDefined();
    });

    it('should prioritize new field names over legacy ones', () => {
      const input = {
        accepts: [
          {
            output_schema: {
              input: {
                query_params: { new: 'value' },
                query: { old: 'value' },
              },
            },
          },
        ],
      };

      const result = normalizeX402Fields(input) as Record<string, unknown>;
      const accepts = result.accepts as Array<Record<string, unknown>>;
      const outputSchema = accepts[0].outputSchema as Record<string, unknown>;
      const inputSchema = outputSchema.input as Record<string, unknown>;

      // Should use query_params, not query
      expect(inputSchema.queryParams).toEqual({ new: 'value' });
    });

    it('should handle complex nested structure', () => {
      const input = {
        resource_name: 'test-resource',
        x402_version: 1,
        accepts: [
          {
            scheme: 'exact',
            max_amount_required: '1000',
            pay_to: '0x123',
            output_schema: {
              input: {
                query_params: {
                  filter_by: { type: 'string' },
                },
                body_fields: {
                  payload: { type: 'object' },
                },
                body_type: 'application/json',
              },
              output: {
                type: 'object',
              },
            },
          },
        ],
      };

      const result = normalizeX402Fields(input) as Record<string, unknown>;

      expect(result.resourceName).toBe('test-resource');
      expect(result.x402Version).toBe(1);
      expect(Array.isArray(result.accepts)).toBe(true);

      const accepts = result.accepts as Array<Record<string, unknown>>;
      expect(accepts[0].maxAmountRequired).toBe('1000');
      expect(accepts[0].payTo).toBe('0x123');

      const outputSchema = accepts[0].outputSchema as Record<string, unknown>;
      const inputSchema = outputSchema.input as Record<string, unknown>;

      expect(inputSchema.queryParams).toBeDefined();
      expect(inputSchema.bodyFields).toBeDefined();
      expect(inputSchema.bodyType).toBe('application/json');
    });

    it('should handle empty objects', () => {
      const input = {};
      const result = normalizeX402Fields(input);

      expect(result).toEqual({});
    });

    it('should handle objects with no snake_case keys', () => {
      const input = {
        simple: 'value',
        another: 'test',
      };

      const result = normalizeX402Fields(input) as Record<string, unknown>;

      expect(result.simple).toBe('value');
      expect(result.another).toBe('test');
    });
  });
});