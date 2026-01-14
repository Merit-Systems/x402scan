import { describe, it, expect } from 'vitest';
import {
  normalizePaymentRequired,
  isV1Response,
  extractV1Schema,
} from '@/server/lib/x402/protocol';

describe('isV1Response', () => {
  it('detects v1 response by x402Version field', () => {
    expect(isV1Response({ x402Version: 1, accepts: [] })).toBe(true);
  });

  it('detects v1 response by maxAmountRequired field', () => {
    expect(
      isV1Response({
        accepts: [{ maxAmountRequired: '1000000', scheme: 'exact' }],
      })
    ).toBe(true);
  });

  it('detects v2 response by amount field', () => {
    expect(
      isV1Response({
        x402Version: 2,
        accepts: [{ amount: '1000000', scheme: 'exact' }],
      })
    ).toBe(false);
  });

  it('returns false for invalid input', () => {
    expect(isV1Response(null)).toBe(false);
    expect(isV1Response(undefined)).toBe(false);
    expect(isV1Response('string')).toBe(false);
    expect(isV1Response({})).toBe(false);
  });
});

describe('normalizePaymentRequired', () => {
  it('normalizes v1 response', () => {
    const v1 = {
      x402Version: 1,
      accepts: [
        {
          scheme: 'exact',
          network: 'eip155:8453',
          maxAmountRequired: '1000000',
          asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          payTo: '0x1234567890123456789012345678901234567890',
          maxTimeoutSeconds: 300,
          resource: 'https://api.example.com/data',
          description: 'API call',
          mimeType: 'application/json',
        },
      ],
    };

    const result = normalizePaymentRequired(v1);

    expect(result.x402Version).toBe(1);
    expect(result.accepts).toHaveLength(1);
    expect(result.accepts[0]?.amount).toBe('1000000');
    expect(result.accepts[0]?.resource).toBe('https://api.example.com/data');
    expect(result.accepts[0]?.description).toBe('API call');
  });

  it('normalizes v2 response', () => {
    const v2 = {
      x402Version: 2,
      accepts: [
        {
          scheme: 'exact',
          network: 'eip155:8453',
          amount: '2000000',
          asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          payTo: '0x1234567890123456789012345678901234567890',
          maxTimeoutSeconds: 300,
        },
      ],
      resource: {
        url: 'https://api.example.com/data',
        description: 'API endpoint',
        mimeType: 'application/json',
      },
      extensions: {
        bazaar: { info: 'test' },
      },
    };

    const result = normalizePaymentRequired(v2);

    expect(result.x402Version).toBe(2);
    expect(result.accepts[0]?.amount).toBe('2000000');
    expect(result.accepts[0]?.resource).toBeUndefined();
    expect(result.resource?.url).toBe('https://api.example.com/data');
    expect(result.extensions?.bazaar).toEqual({ info: 'test' });
  });

  it('throws on v1 missing maxAmountRequired', () => {
    const invalid = {
      x402Version: 1,
      accepts: [{ scheme: 'exact', network: 'eip155:8453' }],
    };

    expect(() => normalizePaymentRequired(invalid)).toThrow(
      'maxAmountRequired'
    );
  });

  it('throws on v2 missing amount', () => {
    const invalid = {
      x402Version: 2,
      accepts: [{ scheme: 'exact', network: 'eip155:8453' }],
    };

    expect(() => normalizePaymentRequired(invalid)).toThrow('amount');
  });
});

describe('extractV1Schema', () => {
  it('extracts GET schema', () => {
    const accept = {
      outputSchema: {
        input: { type: 'http', method: 'get' },
        output: { type: 'object' },
      },
    };

    const result = extractV1Schema(accept);

    expect(result).not.toBeNull();
    expect(result?.input).toEqual({ type: 'http', method: 'GET' });
    expect(result?.output).toEqual({
      type: 'json',
      example: { type: 'object' },
    });
  });

  it('extracts POST schema with body', () => {
    const accept = {
      outputSchema: {
        input: {
          type: 'http',
          method: 'post',
          body: { prompt: 'string' },
        },
      },
    };

    const result = extractV1Schema(accept);

    expect(result).not.toBeNull();
    expect(result?.input).toEqual({
      type: 'http',
      method: 'POST',
      bodyType: 'json',
      body: { prompt: 'string' },
    });
  });

  it('returns null for non-http schema', () => {
    const accept = {
      outputSchema: {
        input: { type: 'websocket', method: 'connect' },
      },
    };

    expect(extractV1Schema(accept)).toBeNull();
  });

  it('returns null for discoverable=false', () => {
    const accept = {
      outputSchema: {
        input: { type: 'http', method: 'get', discoverable: false },
      },
    };

    expect(extractV1Schema(accept)).toBeNull();
  });

  it('returns null for missing outputSchema', () => {
    expect(extractV1Schema({})).toBeNull();
    expect(extractV1Schema({ outputSchema: null })).toBeNull();
  });
});
