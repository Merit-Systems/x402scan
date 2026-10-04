import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@agentcash/discovery', () => ({
  getOpenAPI: vi.fn(),
  isOpenApiParseFailure: (value: unknown) =>
    value !== null && typeof value === 'object' && 'parseFailure' in value,
  checkEndpointSchema: vi.fn(),
  getWarningsForL3: vi.fn(() => []),
  validatePaymentRequiredDetailed: vi.fn(),
}));

import { getOpenAPI } from '@agentcash/discovery';

import { declaredBodyFromOpenApi } from './probe';

const document = {
  paths: {
    '/v1/rights/preflight/x402': {
      post: {
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['resource'],
                properties: { resource: { type: 'string', format: 'uri' } },
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
  },
};

describe('declaredBodyFromOpenApi', () => {
  beforeEach(() => {
    vi.mocked(getOpenAPI).mockReset();
  });

  it('recovers the media-type example from the raw document', async () => {
    vi.mocked(getOpenAPI).mockResolvedValue({
      isOk: () => true,
      value: { raw: document },
    } as never);
    await expect(
      declaredBodyFromOpenApi(
        'https://api.getacqpath.com/v1/rights/preflight/x402?unused=1',
        'POST'
      )
    ).resolves.toEqual({
      resource: 'https://rslstandard.org/',
      purpose: 'ai-input',
      max_total_micro: '20000',
    });
    expect(vi.mocked(getOpenAPI)).toHaveBeenCalledWith(
      'https://api.getacqpath.com',
      undefined,
      expect.any(AbortSignal)
    );
  });

  it('returns undefined when the document failed to parse', async () => {
    vi.mocked(getOpenAPI).mockResolvedValue({
      isOk: () => true,
      value: {
        parseFailure: true,
        fetchedUrl: 'https://api.getacqpath.com/openapi.json',
      },
    } as never);
    await expect(
      declaredBodyFromOpenApi(
        'https://api.getacqpath.com/v1/rights/preflight/x402'
      )
    ).resolves.toBeUndefined();
  });

  it('returns undefined when the lookup itself fails', async () => {
    vi.mocked(getOpenAPI).mockResolvedValue({
      isOk: () => false,
      error: new Error('down'),
    } as never);
    await expect(
      declaredBodyFromOpenApi(
        'https://api.getacqpath.com/v1/rights/preflight/x402'
      )
    ).resolves.toBeUndefined();
  });
});
