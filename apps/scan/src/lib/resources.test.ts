import { describe, it, expect } from 'vitest';
import { outputSchemaV1 } from '@/lib/x402/v1';

// Re-implement locally since the functions are not exported.
// This mirrors the production code in resources.ts exactly.

function openApiPropertyToFieldDef(
  name: string,
  schema: unknown,
  requiredFields: unknown
): Record<string, unknown> {
  const s =
    typeof schema === 'object' && schema !== null
      ? (schema as Record<string, unknown>)
      : {};
  const isRequired =
    Array.isArray(requiredFields) && requiredFields.includes(name);

  return {
    ...(typeof s.type === 'string' ? { type: s.type } : {}),
    ...(isRequired ? { required: true } : {}),
    ...(typeof s.description === 'string'
      ? { description: s.description }
      : {}),
    ...(Array.isArray(s.enum) ? { enum: s.enum.map(String) } : {}),
    ...(s.properties ? { properties: s.properties } : {}),
    ...(s.items ? { items: s.items } : {}),
  };
}

function openApiParamToFieldDef(
  param: Record<string, unknown>
): Record<string, unknown> {
  const schema =
    typeof param.schema === 'object' && param.schema !== null
      ? (param.schema as Record<string, unknown>)
      : {};

  return {
    ...(typeof schema.type === 'string' ? { type: schema.type } : {}),
    ...(param.required === true ? { required: true } : {}),
    ...(typeof param.description === 'string'
      ? { description: param.description }
      : {}),
    ...(Array.isArray(schema.enum) ? { enum: schema.enum.map(String) } : {}),
  };
}

function convertOpenApiSchemaToV1(
  inputSchema: Record<string, unknown>,
  method: string,
  outputSchema?: Record<string, unknown>
) {
  const input: Record<string, unknown> = {
    type: 'http',
    method: method.toUpperCase(),
  };

  const hasRequestBody = 'requestBody' in inputSchema;
  const hasParameters =
    'parameters' in inputSchema && Array.isArray(inputSchema.parameters);
  const isBareJsonSchema =
    !hasRequestBody &&
    !hasParameters &&
    ('properties' in inputSchema || 'type' in inputSchema);

  const bodySource = hasRequestBody
    ? (inputSchema.requestBody as Record<string, unknown>)
    : isBareJsonSchema
      ? inputSchema
      : undefined;

  if (bodySource) {
    const properties = bodySource.properties as
      | Record<string, unknown>
      | undefined;
    if (properties) {
      const bodyFields: Record<string, Record<string, unknown>> = {};
      for (const [name, schema] of Object.entries(properties)) {
        bodyFields[name] = openApiPropertyToFieldDef(
          name,
          schema,
          bodySource.required
        );
      }
      input.bodyFields = bodyFields;
      if (!('method' in input) || input.method === 'GET') {
        input.method = 'POST';
      }
    }
  }

  if (hasParameters) {
    const parameters = inputSchema.parameters as Record<string, unknown>[];
    const queryParams: Record<string, Record<string, unknown>> = {};
    const headerFields: Record<string, Record<string, unknown>> = {};

    for (const param of parameters) {
      if (typeof param.name !== 'string') continue;
      const fieldDef = openApiParamToFieldDef(param);
      if (param.in === 'query') {
        queryParams[param.name] = fieldDef;
      } else if (param.in === 'header') {
        headerFields[param.name] = fieldDef;
      }
    }

    if (Object.keys(queryParams).length > 0) input.queryParams = queryParams;
    if (Object.keys(headerFields).length > 0) input.headerFields = headerFields;
  }

  if (!input.bodyFields && !input.queryParams && !input.headerFields) {
    return undefined;
  }

  return outputSchemaV1.safeParse({
    input,
    output: outputSchema ?? null,
  }).data;
}

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

    // Method is GET but body fields exist — should flip to POST
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

    // Double-check it passes v1 validation
    const validation = outputSchemaV1.safeParse(result);
    expect(validation.success).toBe(true);
  });

  it('skips parameters with no name', () => {
    const schema = {
      parameters: [
        { in: 'query', schema: { type: 'string' } }, // missing name
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
