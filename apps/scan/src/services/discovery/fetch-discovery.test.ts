import { beforeEach, describe, expect, it, vi } from 'vitest';

import { discoverOriginSchema } from '@agentcash/discovery';
import { fetchDiscoveryDocument } from './fetch-discovery';

import type { JsonValue } from '@/lib/json';

vi.mock('@agentcash/discovery', () => ({
  discoverOriginSchema: vi.fn(),
}));

vi.mock('@/lib/url-helpers', () => ({
  isLocalUrl: () => false,
  isTunnelUrl: () => false,
}));

vi.mock('@/lib/discovery/vercel-preview', () => ({
  isVercelPreviewDeployment: () => Promise.resolve(false),
  VERCEL_PREVIEW_ERROR_MESSAGE: 'preview',
}));

const ORIGIN = 'https://merchant.example';

function mockDiscovered(
  endpoints = [
    { path: '/v1/paid', method: 'GET', authMode: 'paid' },
    {
      path: '/v1/control/consume',
      method: 'POST',
      authMode: 'unprotected',
    },
  ]
) {
  vi.mocked(discoverOriginSchema).mockResolvedValue({
    found: true,
    origin: ORIGIN,
    source: 'openapi',
    endpoints,
    ownershipProofs: [],
  } as never);
}

function openApiResponse(document: JsonValue, status = 200) {
  return new Response(JSON.stringify(document), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('fetchDiscoveryDocument operation-level registry metadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    mockDiscovered();
  });

  it('enriches registration from same-origin OpenAPI metadata with JSON accept header', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        openApiResponse({
          openapi: '3.1.0',
          paths: {
            '/v1/paid': {
              get: {
                'x-query-parameters-schema': {
                  anyOf: [{ required: ['symbols'] }],
                },
              },
            },
            '/v1/control/consume': {
              post: {
                security: [],
                'x-x402scan-register': false,
              },
            },
          },
        })
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchDiscoveryDocument(ORIGIN, false, true);

    expect(result.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      ORIGIN + '/openapi.json',
      expect.objectContaining({
        headers: { Accept: 'application/json' },
      })
    );
    expect(result.resources).toEqual([
      expect.objectContaining({
        url: ORIGIN + '/v1/paid',
        queryParametersSchema: {
          anyOf: [{ required: ['symbols'] }],
        },
      }),
      expect.objectContaining({
        url: ORIGIN + '/v1/control/consume',
        registryEligible: false,
      }),
    ]);
  });

  it('fails closed when required registration metadata fetch throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline')))
    );

    const result = await fetchDiscoveryDocument(ORIGIN, false, true);

    expect(result.success).toBe(false);
    expect(result.resources).toEqual([]);
    expect(result.error).toMatch(/metadata could not be fetched/i);
  });

  it('fails closed when required registration metadata returns non-OK', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(openApiResponse({ error: 'busy' }, 503)))
    );

    const result = await fetchDiscoveryDocument(ORIGIN, false, true);

    expect(result.success).toBe(false);
    expect(result.resources).toEqual([]);
    expect(result.error).toMatch(/metadata could not be fetched/i);
  });

  it('does not perform the enrichment fetch outside registration mode', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchDiscoveryDocument(ORIGIN);

    expect(result.success).toBe(true);
    expect(result.resources).toHaveLength(2);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('matches raw OpenAPI keys through server base-path and trailing-slash normalization', async () => {
    mockDiscovered([
      {
        path: '/v1/control/consume',
        method: 'POST',
        authMode: 'unprotected',
      },
      { path: '/v1/paid', method: 'GET', authMode: 'paid' },
    ]);

    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          openApiResponse({
            openapi: '3.1.0',
            servers: [{ url: ORIGIN + '/v1/' }],
            paths: {
              '/control/consume/': {
                post: {
                  security: [],
                  'x-x402scan-register': false,
                },
              },
              '/paid/': {
                get: {
                  'x-query-parameters-schema': {
                    anyOf: [{ required: ['symbols'] }],
                  },
                },
              },
            },
          })
        )
      )
    );

    const result = await fetchDiscoveryDocument(ORIGIN, false, true);

    expect(result.success).toBe(true);
    expect(result.resources).toEqual([
      expect.objectContaining({
        url: ORIGIN + '/v1/control/consume',
        registryEligible: false,
      }),
      expect.objectContaining({
        url: ORIGIN + '/v1/paid',
        queryParametersSchema: {
          anyOf: [{ required: ['symbols'] }],
        },
      }),
    ]);
  });

  it('fails closed when registry eligibility extension value is malformed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          openApiResponse({
            openapi: '3.1.0',
            paths: {
              '/v1/control/consume': {
                post: {
                  security: [],
                  'x-x402scan-register': 'false',
                },
              },
            },
          })
        )
      )
    );

    const result = await fetchDiscoveryDocument(ORIGIN, false, true);

    expect(result.success).toBe(true);
    const consume = result.resources.find(
      resource => resource.url === ORIGIN + '/v1/control/consume'
    );
    expect(consume?.registryEligible).toBe(false);
  });
  it('keeps first-server base path when later server entries are not absolute URLs', async () => {
    mockDiscovered([
      {
        path: '/v1/control/consume',
        method: 'POST',
        authMode: 'unprotected',
      },
    ]);

    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          openApiResponse({
            openapi: '3.1.0',
            servers: [{ url: ORIGIN + '/v1' }, { url: '/relative' }],
            paths: {
              '/control/consume': {
                post: {
                  security: [],
                  'x-x402scan-register': false,
                },
              },
            },
          })
        )
      )
    );

    const result = await fetchDiscoveryDocument(ORIGIN, false, true);

    expect(result.success).toBe(true);
    expect(result.resources).toEqual([
      expect.objectContaining({
        url: ORIGIN + '/v1/control/consume',
        registryEligible: false,
      }),
    ]);
  });
});
