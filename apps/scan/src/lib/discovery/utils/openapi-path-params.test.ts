import { describe, expect, it } from 'vitest';

import type { JsonObject } from '@/lib/json';

import parameterizedPathFixture from '../__fixtures__/parameterized-path.openapi.json';
import { instantiateOpenApiPathParameterExamples } from './openapi-path-params';

describe('instantiateOpenApiPathParameterExamples', () => {
  it('uses parameter.example', () => {
    const result = instantiate(
      '/users/{id}',
      parameter('id', { type: 'string' }, { example: '123' })
    );
    expect(result).toEqual({
      success: true,
      probeUrl: 'https://example.test/users/123',
    });
  });

  it('uses schema.example and safely encodes colons', () => {
    const result = instantiateOpenApiPathParameterExamples(
      'https://example.test/v1/entity/{entityId}/profile',
      parameterizedPathFixture,
      'GET'
    );
    expect(result).toEqual({
      success: true,
      probeUrl:
        'https://example.test/v1/entity/entity%3Aexample%3A12345/profile',
    });
  });

  it('uses the first schema-compatible parameter.examples value', () => {
    const result = instantiate(
      '/users/{id}',
      parameter(
        'id',
        { type: 'string' },
        {
          examples: {
            invalid: { value: { nested: true } },
            firstScalar: { value: '123' },
            secondScalar: { value: '456' },
          },
        }
      )
    );
    expect(result).toMatchObject({
      success: true,
      probeUrl: 'https://example.test/users/123',
    });
  });

  it('uses the first schema-compatible schema.examples value', () => {
    const result = instantiate(
      '/users/{id}',
      parameter('id', {
        type: 'integer',
        minimum: 1,
        examples: ['not-an-integer', 42, 99],
      })
    );
    expect(result).toMatchObject({
      success: true,
      probeUrl: 'https://example.test/users/42',
    });
  });

  it('resolves every parameter in a multi-parameter path independently', () => {
    const result = instantiate('/v1/{network}/wallet/{address}', [
      parameter('network', { type: 'string' }, { example: 'eip155:8453' }),
      parameter('address', { type: 'string' }, { example: '0xabc?admin=true' }),
    ]);
    expect(result).toMatchObject({
      success: true,
      probeUrl:
        'https://example.test/v1/eip155%3A8453/wallet/0xabc%3Fadmin%3Dtrue',
    });
  });

  it('returns an explicit diagnostic when an example is missing', () => {
    const result = instantiate(
      '/users/{id}',
      parameter('id', { type: 'string' })
    );
    expect(result).toEqual({
      success: false,
      error: expect.stringContaining(
        'required path parameter "id" has no valid scalar example'
      ),
    });
  });

  it('preserves the canonical template and encodes traversal-like segments', () => {
    const template = 'https://example.test/files/{name}';
    const result = instantiateOpenApiPathParameterExamples(
      template,
      openApi(
        '/files/{name}',
        parameter('name', { type: 'string' }, { example: '../admin' })
      ),
      'GET'
    );
    expect(template).toBe('https://example.test/files/{name}');
    expect(result).toEqual({
      success: true,
      probeUrl: 'https://example.test/files/%2E%2E%2Fadmin',
    });
  });

  it('supports local Parameter Object references', () => {
    const document = openApi('/users/{id}', {
      $ref: '#/components/parameters/UserId',
    });
    document.components = {
      parameters: {
        UserId: parameter('id', { type: 'string', example: 'abc' }),
      },
    };
    expect(
      instantiateOpenApiPathParameterExamples(
        'https://example.test/users/{id}',
        document,
        'GET'
      )
    ).toMatchObject({
      success: true,
      probeUrl: 'https://example.test/users/abc',
    });
  });
});

function instantiate(path: string, parameters: JsonObject | JsonObject[]) {
  return instantiateOpenApiPathParameterExamples(
    `https://example.test${path}`,
    openApi(path, parameters),
    'GET'
  );
}

function openApi(
  path: string,
  parameters: JsonObject | JsonObject[]
): JsonObject {
  return {
    openapi: '3.1.0',
    info: { title: 'Fixture', version: '1.0.0' },
    paths: {
      [path]: {
        get: {
          parameters: Array.isArray(parameters) ? parameters : [parameters],
        },
      },
    },
  };
}

function parameter(
  name: string,
  schema: JsonObject,
  fields: JsonObject = {}
): JsonObject {
  return {
    name,
    in: 'path',
    required: true,
    schema,
    ...fields,
  };
}
