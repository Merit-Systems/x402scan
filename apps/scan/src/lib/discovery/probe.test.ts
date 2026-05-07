import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Result } from 'better-result';
import type { CheckEndpointResult } from '@agentcash/discovery';

// Hoist the mock so it's set before probe.ts evaluates its imports.
vi.mock('@agentcash/discovery', () => ({
  checkEndpointSchema: vi.fn(),
  // Real discovery's getWarningsForL3 is pure; a stub returning [] keeps the
  // probe success path simple without dragging the real module in.
  getWarningsForL3: () => [],
}));

import { checkEndpointSchema } from '@agentcash/discovery';
import { probeX402Endpoint } from './probe';

const mockCheck = checkEndpointSchema as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockCheck.mockReset();
});

const url = 'https://api.example.com/pay';

const notFound = (cause: 'not_found' | 'network' | 'timeout'): CheckEndpointResult => ({
  found: false,
  origin: 'https://api.example.com',
  path: '/pay',
  cause,
  message: `mock ${cause}`,
});

const successWithoutX402: CheckEndpointResult = {
  found: true,
  origin: 'https://api.example.com',
  path: '/pay',
  advisories: [],
};

const successWithX402: CheckEndpointResult = {
  found: true,
  origin: 'https://api.example.com',
  path: '/pay',
  advisories: [
    {
      method: 'POST',
      paymentOptions: [{ protocol: 'x402', network: 'base', payTo: '0x0' }],
      // Minimum fields needed by ProbeX402Ok consumers in this test.
      // Cast keeps the test free of L3Result internals.
    } as never,
  ],
};

describe('probeX402Endpoint URL validation (no network)', () => {
  it('returns InvalidUrl for malformed input', async () => {
    const result = await probeX402Endpoint('not a url');
    expect(Result.isError(result)).toBe(true);
    if (Result.isError(result)) expect(result.error._tag).toBe('InvalidUrl');
    expect(mockCheck).not.toHaveBeenCalled();
  });

  it('returns InvalidUrl for non-http(s) protocol', async () => {
    const result = await probeX402Endpoint('ftp://example.com');
    expect(Result.isError(result)).toBe(true);
    if (Result.isError(result)) expect(result.error._tag).toBe('InvalidUrl');
  });

  it('returns LocalUrlNotSupported for localhost', async () => {
    const result = await probeX402Endpoint('http://localhost:3000/pay');
    expect(Result.isError(result)).toBe(true);
    if (Result.isError(result))
      expect(result.error._tag).toBe('LocalUrlNotSupported');
    expect(mockCheck).not.toHaveBeenCalled();
  });

  it('returns LocalUrlNotSupported for private IPs', async () => {
    const result = await probeX402Endpoint('http://192.168.1.1/pay');
    expect(Result.isError(result)).toBe(true);
    if (Result.isError(result))
      expect(result.error._tag).toBe('LocalUrlNotSupported');
  });
});

describe('probeX402Endpoint upstream errors', () => {
  it('maps cause=network to ProbeNetworkError', async () => {
    mockCheck.mockResolvedValueOnce(notFound('network'));
    mockCheck.mockResolvedValueOnce(notFound('network'));
    const result = await probeX402Endpoint(url);
    expect(Result.isError(result)).toBe(true);
    if (Result.isError(result))
      expect(result.error._tag).toBe('ProbeNetworkError');
  });

  it('maps cause=timeout to ProbeTimeout', async () => {
    mockCheck.mockResolvedValueOnce(notFound('timeout'));
    mockCheck.mockResolvedValueOnce(notFound('timeout'));
    const result = await probeX402Endpoint(url);
    expect(Result.isError(result)).toBe(true);
    if (Result.isError(result)) {
      expect(result.error._tag).toBe('ProbeTimeout');
      // The variant should carry the timeout duration as a typed field.
      if (result.error._tag === 'ProbeTimeout') {
        expect(typeof result.error.timeoutMs).toBe('number');
      }
    }
  });

  it('maps cause=not_found to No402Challenge', async () => {
    mockCheck.mockResolvedValueOnce(notFound('not_found'));
    mockCheck.mockResolvedValueOnce(notFound('not_found'));
    const result = await probeX402Endpoint(url);
    expect(Result.isError(result)).toBe(true);
    if (Result.isError(result))
      expect(result.error._tag).toBe('No402Challenge');
  });

  it('maps a thrown checkEndpointSchema to ProbeUnexpectedError', async () => {
    mockCheck.mockRejectedValueOnce(new Error('boom'));
    const result = await probeX402Endpoint(url);
    expect(Result.isError(result)).toBe(true);
    if (Result.isError(result))
      expect(result.error._tag).toBe('ProbeUnexpectedError');
  });

  it('returns No402Challenge when 200-but-no-x402-advisory', async () => {
    // First probe finds the endpoint but no advisory carries x402.
    mockCheck.mockResolvedValueOnce(successWithoutX402);
    // OpenAPI fallback: also no useful inputSchema -> probe gives up.
    mockCheck.mockResolvedValueOnce(successWithoutX402);
    const result = await probeX402Endpoint(url);
    expect(Result.isError(result)).toBe(true);
    if (Result.isError(result))
      expect(result.error._tag).toBe('No402Challenge');
  });
});

describe('probeX402Endpoint success', () => {
  it('returns Ok with advisory when x402 advisory is present', async () => {
    mockCheck.mockResolvedValueOnce(successWithX402);
    const result = await probeX402Endpoint(url);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.advisory.method).toBe('POST');
      expect(Array.isArray(result.value.warnings)).toBe(true);
    }
  });
});
