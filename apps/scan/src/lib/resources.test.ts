import { describe, it, expect } from 'vitest';
import { outputSchemaV1 } from '@/lib/x402/v1';
import { convertOpenApiSchemaToV1 } from './openapi-to-v1';

describe('convertOpenApiSchemaToV1', () => {
  it('converts a bare JSON Schema (POST requestBody) to v1 format', () => {
    const schema = {
      type: 'object',
      properties: {
        publicationSlug: {
          type: 'string',
          description: 'The publication slug',
        },
        postSlug: { type: 'string', description: 'The post slug' },
      },
      required: ['publicationSlug', 'postSlug'],
    };

    const result = convertOpenApiSchemaToV1(schema, 'GET');
    expect(result).toBeDefined();
    expect(result!.input.method).toBe('POST');
    expect(result!.input.bodyFields).toBeDefined();
    expect(result!.input.bodyFields!.publicationSlug).toEqual({
      type: 'string',
      required: true,
      description: 'The publication slug',
    });
    expect(result!.input.bodyFields!.postSlug).toEqual({
      type: 'string',
      required: true,
      description: 'The post slug',
    });
  });

  it('converts query parameters to v1 queryParams', () => {
    const schema = {
      parameters: [
        {
          name: 'q',
          in: 'query',
          schema: { type: 'string' },
          required: true,
          description: 'Search query',
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer' },
          required: false,
        },
      ],
    };

    const result = convertOpenApiSchemaToV1(schema, 'GET');
    expect(result).toBeDefined();
    expect(result!.input.method).toBe('GET');
    expect(result!.input.queryParams).toBeDefined();
    expect(result!.input.queryParams!.q).toEqual({
      type: 'string',
      required: true,
      description: 'Search query',
    });
    expect(result!.input.queryParams!.limit).toEqual({
      type: 'integer',
    });
  });

  it('converts mixed requestBody + parameters', () => {
    const schema = {
      requestBody: {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      },
      parameters: [
        {
          name: 'X-Api-Version',
          in: 'header',
          schema: { type: 'string' },
          required: true,
        },
      ],
    };

    const result = convertOpenApiSchemaToV1(schema, 'POST');
    expect(result).toBeDefined();
    expect(result!.input.method).toBe('POST');
    expect(result!.input.bodyFields).toBeDefined();
    expect(result!.input.bodyFields!.name).toEqual({ type: 'string' });
    expect(result!.input.headerFields).toBeDefined();
    expect(result!.input.headerFields!['X-Api-Version']).toEqual({
      type: 'string',
      required: true,
    });
  });

  it('returns undefined for empty schema', () => {
    const result = convertOpenApiSchemaToV1({}, 'GET');
    expect(result).toBeUndefined();
  });

  it('preserves the specified method for POST with body', () => {
    const schema = {
      requestBody: {
        type: 'object',
        properties: { data: { type: 'string' } },
      },
    };

    const result = convertOpenApiSchemaToV1(schema, 'PUT');
    expect(result).toBeDefined();
    expect(result!.input.method).toBe('PUT');
  });

  it('overrides GET to POST when body fields exist', () => {
    const schema = {
      type: 'object',
      properties: { data: { type: 'string' } },
    };

    const result = convertOpenApiSchemaToV1(schema, 'GET');
    expect(result).toBeDefined();
    expect(result!.input.method).toBe('POST');
  });

  it('handles enum fields in properties', () => {
    const schema = {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['active', 'inactive'],
          description: 'Filter by status',
        },
      },
    };

    const result = convertOpenApiSchemaToV1(schema, 'POST');
    expect(result).toBeDefined();
    expect(result!.input.bodyFields!.status).toEqual({
      type: 'string',
      enum: ['active', 'inactive'],
      description: 'Filter by status',
    });
  });

  it('passes output schema through to the result', () => {
    const inputSchema = {
      type: 'object',
      properties: { q: { type: 'string' } },
    };
    const outputSchema = {
      type: 'object',
      properties: { result: { type: 'string' } },
    };

    const result = convertOpenApiSchemaToV1(inputSchema, 'POST', outputSchema);
    expect(result).toBeDefined();
    expect(result!.output).toEqual(outputSchema);
  });

  it('produces output that passes outputSchemaV1 validation', () => {
    const schema = {
      parameters: [
        {
          name: 'address',
          in: 'query',
          schema: { type: 'string' },
          required: true,
          description: 'Wallet address',
        },
      ],
    };

    const result = convertOpenApiSchemaToV1(schema, 'GET');
    expect(result).toBeDefined();

    const validation = outputSchemaV1.safeParse(result);
    expect(validation.success).toBe(true);
  });

  it('skips parameters with no name', () => {
    const schema = {
      parameters: [
        { in: 'query', schema: { type: 'string' } },
        {
          name: 'valid',
          in: 'query',
          schema: { type: 'string' },
          required: true,
        },
      ],
    };

    const result = convertOpenApiSchemaToV1(schema, 'GET');
    expect(result).toBeDefined();
    expect(result!.input.queryParams).toBeDefined();
    expect(Object.keys(result!.input.queryParams!)).toEqual(['valid']);
  });
});
