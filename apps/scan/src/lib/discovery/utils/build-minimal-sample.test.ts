import { describe, it, expect } from 'vitest';
import {
  buildMinimalSampleFromInputSchema,
  buildMinimalQueryParamsFromInputSchema,
  declaredRequestExample,
  selectProbeBody,
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

  it('keeps a property example when the media type has no example', () => {
    const schema = {
      body: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['resource'],
              properties: {
                resource: {
                  type: 'string',
                  format: 'uri',
                  example: 'https://rslstandard.org/',
                },
              },
            },
          },
        },
      },
    };
    expect(buildMinimalSampleFromInputSchema(schema)).toEqual({
      resource: 'https://rslstandard.org/',
    });
  });

  it('prefers a changed media-type example over property defaults', () => {
    const schema = {
      body: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['resource', 'purpose', 'max_total_micro'],
              properties: {
                resource: {
                  type: 'string',
                  format: 'uri',
                  example: 'https://rslstandard.org/',
                },
                purpose: { type: 'string', enum: ['ai-input', 'search'] },
                max_total_micro: { type: 'string' },
              },
            },
            example: {
              resource: 'https://changed.example/item',
              purpose: 'search',
              max_total_micro: '20000',
            },
          },
        },
      },
    };
    expect(buildMinimalSampleFromInputSchema(schema)).toEqual({
      resource: 'https://changed.example/item',
      purpose: 'search',
      max_total_micro: '20000',
    });
  });

  it('uses the first named example value when example is absent', () => {
    const schema = {
      body: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['resource'],
              properties: {
                resource: { type: 'string', format: 'uri' },
              },
            },
            examples: {
              reviewed: {
                value: { resource: 'https://rslstandard.org/' },
              },
            },
          },
        },
      },
    };
    expect(buildMinimalSampleFromInputSchema(schema)).toEqual({
      resource: 'https://rslstandard.org/',
    });
  });

  it('synthesizes when the media example is not an object', () => {
    const schema = {
      body: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name'],
              properties: { name: { type: 'string' } },
            },
            example: 'not-a-body',
          },
        },
      },
    };
    expect(buildMinimalSampleFromInputSchema(schema)).toEqual({
      name: 'test',
    });
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

const acqPathDocument = {
  paths: {
    '/v1/rights/preflight/x402': {
      post: {
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['resource', 'purpose', 'max_total_micro'],
                properties: {
                  resource: { type: 'string', format: 'uri' },
                  purpose: { type: 'string', enum: ['ai-input', 'search'] },
                  max_total_micro: { type: 'string' },
                },
              },
              example: {
                resource: 'https://rslstandard.org/',
                purpose: 'ai-input',
                max_total_micro: '20000',
              },
            },
          },
        },
      },
    },
    '/v1/plans/{id}': {
      post: {
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['note'],
                properties: { note: { type: 'string' } },
              },
              example: { note: 'from-template' },
            },
          },
        },
      },
    },
  },
};

const discoveryStrippedSchema = {
  type: 'object',
  required: ['resource', 'purpose', 'max_total_micro'],
  properties: {
    resource: { type: 'string', format: 'uri' },
    purpose: { type: 'string', enum: ['ai-input', 'search'] },
    max_total_micro: { type: 'string' },
  },
};

describe('declaredRequestExample', () => {
  it('reads the media-type example discovery drops from the schema', () => {
    expect(
      declaredRequestExample(
        acqPathDocument,
        '/v1/rights/preflight/x402',
        'POST'
      )
    ).toEqual({
      resource: 'https://rslstandard.org/',
      purpose: 'ai-input',
      max_total_micro: '20000',
    });
  });

  it('returns the changed example instead of merging defaults', () => {
    const changed = structuredClone(acqPathDocument);
    changed.paths['/v1/rights/preflight/x402'].post.requestBody.content[
      'application/json'
    ].example = {
      resource: 'https://changed.example/item',
      purpose: 'search',
      max_total_micro: '30000',
    };
    expect(
      declaredRequestExample(changed, '/v1/rights/preflight/x402', 'POST')
    ).toEqual({
      resource: 'https://changed.example/item',
      purpose: 'search',
      max_total_micro: '30000',
    });
  });

  it('matches a templated path and ignores a missing method', () => {
    expect(
      declaredRequestExample(acqPathDocument, '/v1/plans/sku-1', 'POST')
    ).toEqual({ note: 'from-template' });
    expect(
      declaredRequestExample(
        acqPathDocument,
        '/v1/rights/preflight/x402',
        'GET'
      )
    ).toBeUndefined();
  });

  it('does not fetch or accept an externalValue example', () => {
    const externalOnly = {
      paths: {
        '/v1/rights/preflight/x402': {
          post: {
            requestBody: {
              content: {
                'application/json': {
                  schema: discoveryStrippedSchema,
                  examples: {
                    remote: { externalValue: 'https://example.com/body.json' },
                  },
                },
              },
            },
          },
        },
      },
    };
    expect(
      declaredRequestExample(externalOnly, '/v1/rights/preflight/x402', 'POST')
    ).toBeUndefined();
  });
});

describe('selectProbeBody', () => {
  it('rejects the synthesized placeholder when a declared example exists', () => {
    const synthesized = buildMinimalSampleFromInputSchema(
      discoveryStrippedSchema
    );
    expect(synthesized).toEqual({
      resource: 'https://placehold.co/1x1.png',
      purpose: 'ai-input',
      max_total_micro: 'test',
    });
    const declared = declaredRequestExample(
      acqPathDocument,
      '/v1/rights/preflight/x402',
      'POST'
    );
    const chosen = selectProbeBody(declared, synthesized);
    expect(chosen).toEqual(declared);
    expect(chosen).not.toEqual(synthesized);
    expect(JSON.stringify(chosen)).not.toContain('placehold.co');
    expect(JSON.stringify(chosen)).not.toContain('"test"');
  });

  it('keeps synthesis when the document has no usable example', () => {
    const synthesized = buildMinimalSampleFromInputSchema(
      discoveryStrippedSchema
    );
    expect(selectProbeBody(undefined, synthesized)).toEqual(synthesized);
    expect(selectProbeBody({}, synthesized)).toEqual(synthesized);
  });
});
