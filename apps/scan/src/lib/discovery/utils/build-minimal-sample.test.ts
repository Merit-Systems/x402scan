import { describe, it, expect } from 'vitest';
import {
  buildMinimalSampleFromInputSchema,
  buildMinimalQueryParamsFromInputSchema,
} from './build-minimal-sample';

describe('buildMinimalSampleFromInputSchema', () => {
  it('fills top-level required fields with type defaults', () => {
    const schema = {
      body: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'count'],
              properties: {
                name: { type: 'string' },
                count: { type: 'integer' },
                optional: { type: 'string' },
              },
            },
          },
        },
      },
    };
    expect(buildMinimalSampleFromInputSchema(schema)).toEqual({
      name: 'test',
      count: 0,
    });
  });

  it('respects minimum constraint on integers', () => {
    const schema = {
      body: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['duration'],
              properties: {
                duration: { type: 'integer', minimum: 1, maximum: 365 },
              },
            },
          },
        },
      },
    };
    expect(buildMinimalSampleFromInputSchema(schema)).toEqual({ duration: 1 });
  });

  it('merges required fields from first anyOf branch', () => {
    // Reproduces the store.nosub.club schema pattern:
    // top-level required: ["duration"], anyOf: [{ required: ["contentBase64"] }, { required: ["contentText"] }]
    const schema = {
      body: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['duration'],
              anyOf: [
                { required: ['contentBase64'] },
                { required: ['contentText'] },
              ],
              properties: {
                duration: { type: 'integer', minimum: 1, maximum: 365 },
                contentBase64: { type: 'string' },
                contentText: { type: 'string' },
              },
            },
          },
        },
      },
    };
    const result = buildMinimalSampleFromInputSchema(schema);
    expect(result).toEqual({
      duration: 1,
      contentBase64: 'test',
    });
  });

  it('merges required fields from first oneOf branch', () => {
    const schema = {
      body: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['id'],
              oneOf: [{ required: ['payload'] }],
              properties: {
                id: { type: 'string' },
                payload: { type: 'string' },
              },
            },
          },
        },
      },
    };
    const result = buildMinimalSampleFromInputSchema(schema);
    expect(result).toEqual({ id: 'test', payload: 'test' });
  });

  it('handles anyOf with no required fields in branches', () => {
    const schema = {
      body: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name'],
              anyOf: [{ type: 'object' }],
              properties: {
                name: { type: 'string' },
              },
            },
          },
        },
      },
    };
    expect(buildMinimalSampleFromInputSchema(schema)).toEqual({ name: 'test' });
  });

  it('extracts schema from requestBody wrapper (discovery library format)', () => {
    // This is the actual format returned by @agentcash/discovery's
    // checkEndpointSchema — the schema lives under `requestBody`, not
    // `body.content["application/json"].schema`.
    const schema = {
      requestBody: {
        type: 'object',
        required: ['duration'],
        anyOf: [{ required: ['contentBase64'] }, { required: ['contentText'] }],
        properties: {
          duration: { type: 'integer', minimum: 1, maximum: 365 },
          contentBase64: { type: 'string' },
          contentText: { type: 'string' },
        },
      },
      parameters: [
        {
          name: 'duration',
          in: 'query',
          required: false,
          schema: { type: 'integer', minimum: 1 },
        },
      ],
    };
    const result = buildMinimalSampleFromInputSchema(schema);
    expect(result).toEqual({
      duration: 1,
      contentBase64: 'test',
    });
  });

  it('returns undefined for non-object input', () => {
    expect(buildMinimalSampleFromInputSchema(null)).toBeUndefined();
    expect(buildMinimalSampleFromInputSchema('string')).toBeUndefined();
    expect(buildMinimalSampleFromInputSchema([1, 2])).toBeUndefined();
  });

  it('returns undefined when no required fields exist', () => {
    const schema = {
      body: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                optional: { type: 'string' },
              },
            },
          },
        },
      },
    };
    expect(buildMinimalSampleFromInputSchema(schema)).toBeUndefined();
  });
});

describe('buildMinimalQueryParamsFromInputSchema', () => {
  it('fills required query params with schema minimum', () => {
    const schema = {
      parameters: [
        {
          name: 'limit',
          in: 'query',
          required: true,
          schema: { type: 'integer', minimum: 1 },
        },
        {
          name: 'offset',
          in: 'query',
          required: false,
          schema: { type: 'integer' },
        },
      ],
    };
    expect(buildMinimalQueryParamsFromInputSchema(schema)).toEqual({
      limit: '1',
    });
  });
});

describe('buildMinimalQueryParamsFromInputSchema supplemental query schema', () => {
  const inputSchema = {
    parameters: [
      {
        name: 'blockchain',
        in: 'query',
        required: true,
        schema: { type: 'string', example: 'ethereum' },
      },
      {
        name: 'symbols',
        in: 'query',
        required: false,
        schema: { type: 'string', example: 'weth' },
      },
      {
        name: 'contracts',
        in: 'query',
        required: false,
        schema: {
          type: 'string',
          example: '0x0000000000000000000000000000000000000000',
        },
      },
    ],
  };

  it('samples the first anyOf selector without changing parameter required flags', () => {
    const supplemental = {
      type: 'object',
      required: ['blockchain'],
      anyOf: [{ required: ['symbols'] }, { required: ['contracts'] }],
    };
    expect(
      buildMinimalQueryParamsFromInputSchema(inputSchema, supplemental)
    ).toEqual({
      blockchain: 'ethereum',
      symbols: 'weth',
    });
    expect(inputSchema.parameters[1]!.required).toBe(false);
    expect(inputSchema.parameters[2]!.required).toBe(false);
  });

  it('supports oneOf and validates every declared branch', () => {
    expect(
      buildMinimalQueryParamsFromInputSchema(inputSchema, {
        type: 'object',
        required: ['blockchain'],
        oneOf: [{ required: ['contracts'] }, { required: ['symbols'] }],
      })
    ).toEqual({
      blockchain: 'ethereum',
      contracts: '0x0000000000000000000000000000000000000000',
    });

    expect(
      buildMinimalQueryParamsFromInputSchema(inputSchema, {
        anyOf: [{ required: ['symbols'] }, { required: ['undeclared'] }],
      })
    ).toBeUndefined();
  });

  it('fails closed on ambiguous or malformed supplemental branch declarations', () => {
    expect(
      buildMinimalQueryParamsFromInputSchema(inputSchema, {
        anyOf: [{ required: ['symbols'] }],
        oneOf: [{ required: ['contracts'] }],
      })
    ).toBeUndefined();
    expect(
      buildMinimalQueryParamsFromInputSchema(inputSchema, { anyOf: [] })
    ).toBeUndefined();
    expect(
      buildMinimalQueryParamsFromInputSchema(inputSchema, { anyOf: null })
    ).toBeUndefined();
    expect(
      buildMinimalQueryParamsFromInputSchema(inputSchema, {
        required: ['undeclared'],
      })
    ).toBeUndefined();
  });
});
