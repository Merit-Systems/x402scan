import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@agentcash/discovery', () => ({
  getOpenAPI: vi.fn(),
  isOpenApiParseFailure: (value: unknown) =>
    value !== null && typeof value === 'object' && 'parseFailure' in value,
  checkEndpointSchema: vi.fn(),
  getWarningsForL3: vi.fn(() => []),
  validatePaymentRequiredDetailed: vi.fn(),
}));

import { checkEndpointSchema, getOpenAPI } from '@agentcash/discovery';

import { declaredBodyFromOpenApi, probeX402Endpoint } from './probe';

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

describe('probeX402Endpoint example handoff', () => {
  const url = 'https://api.getacqpath.com/v1/rights/preflight/x402';
  const example = document.paths['/v1/rights/preflight/x402'].post
    .requestBody.content['application/json'].example;
  const strippedSchema = {
    type: 'object',
    required: ['resource', 'purpose', 'max_total_micro'],
    properties: {
      resource: { type: 'string', format: 'uri' },
      purpose: { type: 'string', enum: ['ai-input', 'search'] },
      max_total_micro: { type: 'string' },
    },
  };
  const challenge = {
    found: true,
    advisories: [{
      source: 'probe', method: 'POST',
      paymentOptions: [{ protocol: 'x402' }],
    }],
  };
  beforeEach(() => {
    vi.mocked(getOpenAPI).mockReset();
    vi.mocked(checkEndpointSchema).mockReset();
  });

  it('passes the raw document example through the real fallback probe', async () => {
    vi.mocked(checkEndpointSchema)
      .mockResolvedValueOnce({ found: false } as never)
      .mockResolvedValueOnce({
        found: true, advisories: [{ method: 'POST', inputSchema: strippedSchema }],
      } as never)
      .mockResolvedValueOnce(challenge as never);
    vi.mocked(getOpenAPI).mockResolvedValue({
      isOk: () => true, value: { raw: document },
    } as never);
    const result = await probeX402Endpoint(url, 'POST');
    expect(result.success).toBe(true);
    expect(vi.mocked(checkEndpointSchema)).toHaveBeenCalledTimes(3);
    expect(vi.mocked(checkEndpointSchema).mock.calls[2]?.[0])
      .toMatchObject({ url, probe: true, sampleInputBody: example });
    expect(vi.mocked(getOpenAPI)).toHaveBeenCalledTimes(1);
  });

  it('keeps an explicit caller sample ahead of every inferred example', async () => {
    const supplied = { resource: 'https://caller.example/item' };
    vi.mocked(checkEndpointSchema)
      .mockResolvedValueOnce({ found: false } as never)
      .mockResolvedValueOnce(challenge as never);
    expect((await probeX402Endpoint(url, 'POST', supplied)).success).toBe(true);
    expect(vi.mocked(checkEndpointSchema).mock.calls[1]?.[0])
      .toMatchObject({ sampleInputBody: supplied });
    expect(vi.mocked(getOpenAPI)).not.toHaveBeenCalled();
  });

  it('keeps schema synthesis when the raw document is unavailable', async () => {
    vi.mocked(checkEndpointSchema)
      .mockResolvedValueOnce({ found: false } as never)
      .mockResolvedValueOnce({
        found: true, advisories: [{ method: 'POST', inputSchema: strippedSchema }],
      } as never)
      .mockResolvedValueOnce(challenge as never);
    vi.mocked(getOpenAPI).mockResolvedValue({ isOk: () => false } as never);
    expect((await probeX402Endpoint(url, 'POST')).success).toBe(true);
    expect(vi.mocked(checkEndpointSchema).mock.calls[2]?.[0])
      .toMatchObject({ sampleInputBody: {
        resource: 'https://placehold.co/1x1.png',
        purpose: 'ai-input', max_total_micro: 'test',
      } });
  });
});
