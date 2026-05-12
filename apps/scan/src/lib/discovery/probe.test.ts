import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  checkEndpointSchema: vi.fn(),
  getWarningsForL3: vi.fn(() => []),
}));

vi.mock('@agentcash/discovery', () => mocks);

import { probeX402Endpoint } from './probe';

const x402Advisory = {
  method: 'POST',
  paymentOptions: [{ protocol: 'x402' }],
  inputSchema: { type: 'object' },
  paymentRequiredBody: { accepts: [] },
};

describe('probeX402Endpoint', () => {
  beforeEach(() => {
    mocks.checkEndpointSchema.mockReset();
    mocks.getWarningsForL3.mockReset();
    mocks.getWarningsForL3.mockReturnValue([]);
  });

  it('passes custom headers and sample body to the direct probe', async () => {
    mocks.checkEndpointSchema.mockResolvedValueOnce({
      found: true,
      advisories: [x402Advisory],
    });

    const result = await probeX402Endpoint('https://api.example.com/pay', {
      preferredMethod: 'POST',
      headers: { 'X-Api-Key': 'secret' },
      sampleInputBody: { prompt: 'hello' },
    });

    expect(result.success).toBe(true);
    expect(mocks.checkEndpointSchema).toHaveBeenCalledTimes(1);
    expect(mocks.checkEndpointSchema).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://api.example.com/pay',
        headers: { 'X-Api-Key': 'secret' },
        probe: true,
        sampleInputBody: { prompt: 'hello' },
      })
    );
  });

  it('keeps the string preferredMethod overload for existing callers', async () => {
    mocks.checkEndpointSchema.mockResolvedValueOnce({
      found: true,
      advisories: [{ ...x402Advisory, method: 'GET' }],
    });

    const result = await probeX402Endpoint(
      'https://api.example.com/pay',
      'POST'
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.advisory.method).toBe('POST');
    }
  });

  it('uses OpenAPI-derived fallback body when an empty probe misses x402', async () => {
    mocks.checkEndpointSchema
      .mockResolvedValueOnce({
        found: false,
        origin: 'https://api.example.com',
        path: '/pay',
        cause: 'not_found',
      })
      .mockResolvedValueOnce({
        found: true,
        advisories: [
          {
            method: 'POST',
            paymentOptions: [{ protocol: 'x402' }],
            inputSchema: {
              type: 'object',
              properties: { q: { type: 'string' } },
              required: ['q'],
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        found: true,
        advisories: [x402Advisory],
      });

    const result = await probeX402Endpoint('https://api.example.com/pay');

    expect(result.success).toBe(true);
    expect(mocks.checkEndpointSchema).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        probe: true,
        sampleInputBody: { q: 'sample' },
      })
    );
  });
});
