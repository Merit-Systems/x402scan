import { describe, expect, it, vi } from 'vitest';

vi.mock('@/env', () => ({
  env: { NEXT_PUBLIC_APP_URL: 'https://www.x402scan.com' },
}));

import { API_ENDPOINTS } from './api-endpoints';
import { enrichOpenApiDocument, ERROR_TYPES } from './openapi';

const baseDoc = {
  openapi: '3.1.0',
  info: { title: 'x402scan', version: '1.0.0' },
  paths: {
    '/api/x402/merchants/{address}/stats': {
      get: {
        operationId: 'x402_merchants_stats',
        summary: 'Aggregate stats for a merchant',
        responses: {
          '200': { description: 'Successful response' },
          '402': { description: 'Payment Required' },
        },
      },
    },
    '/api/x402/registry/register': {
      post: {
        operationId: 'x402_registry_register',
        summary: 'Register',
        responses: { '200': { description: 'ok' } },
      },
    },
  },
};

describe('enrichOpenApiDocument', () => {
  const doc = enrichOpenApiDocument(baseDoc);
  const stats = doc.paths!['/api/x402/merchants/{address}/stats']!.get!;
  const register = doc.paths!['/api/x402/registry/register']!.post!;

  it('adds a typed Error schema and references it from 4xx/5xx responses', () => {
    expect(doc.components?.schemas?.Error).toMatchObject({
      type: 'object',
      required: ['success', 'error'],
    });
    for (const status of ['400', '404', '429', '500']) {
      expect(stats.responses?.[status]?.content).toEqual({
        'application/json': {
          schema: { $ref: '#/components/schemas/Error' },
        },
      });
    }
    expect(register.responses?.['422']?.content).toBeDefined();
    expect(stats.responses?.['422']).toBeUndefined();
  });

  it('documents every error type used by the API', () => {
    expect(ERROR_TYPES).toEqual(
      expect.arrayContaining([
        'not_found',
        'rate_limited',
        'invalid_address',
        'no_discovery',
        'not_in_spec',
      ])
    );
  });

  it('adds rate-limit and version headers to every response', () => {
    for (const response of Object.values(stats.responses ?? {})) {
      expect(response.headers).toMatchObject({
        'RateLimit-Policy': expect.anything(),
        RateLimit: expect.anything(),
        'X-API-Version': expect.anything(),
      });
    }
    expect(stats.responses?.['429']?.headers?.['Retry-After']).toBeDefined();
  });

  it('declares templated path parameters with catalog descriptions', () => {
    expect(stats.parameters).toEqual([
      expect.objectContaining({
        name: 'address',
        in: 'path',
        required: true,
        description: expect.stringContaining('Solana'),
      }),
    ]);
    expect(register.parameters).toBeUndefined();
  });

  it('fills in operation descriptions from the endpoint catalog', () => {
    const catalog = API_ENDPOINTS.find(
      e => e.operationId === 'x402_merchants_stats'
    )!;
    expect(stats.description).toBe(catalog.description);
    expect(stats.summary).toBe('Aggregate stats for a merchant');
  });

  it('explains the 402 handshake and keeps the original status', () => {
    expect(stats.responses?.['402']?.description).toContain('X-Payment');
    expect(
      stats.responses?.['402']?.headers?.['PAYMENT-REQUIRED']
    ).toBeDefined();
  });

  it('publishes versioning, deprecation and rate-limit policy metadata', () => {
    expect(doc['x-versioning']).toMatchObject({
      scheme: 'url-path',
      current: '1',
      basePath: '/api/x402',
      responseHeader: 'X-API-Version',
    });
    expect(String(doc['x-versioning'])).toBeDefined();
    expect(doc['x-rate-limit']).toMatchObject({
      limit: 120,
      windowSeconds: 60,
    });
    expect(doc.info.version).toBe('1.0.0');
    expect(doc.externalDocs).toMatchObject({
      url: expect.stringContaining('/docs'),
    });
  });

  it('does not mutate its input', () => {
    const snapshot = JSON.stringify(baseDoc);
    enrichOpenApiDocument(baseDoc);
    expect(JSON.stringify(baseDoc)).toBe(snapshot);
  });

  it('every catalog entry has a unique operationId', () => {
    const ids = API_ENDPOINTS.map(e => e.operationId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(15);
  });
});
