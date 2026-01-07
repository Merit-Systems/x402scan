import { describe, it, expect } from 'vitest';
import { parseV2 } from './parser';

// Sample V2 responses for testing
const v2Responses = {
  basic: {
    x402Version: 2,
    accepts: [
      {
        scheme: 'exact' as const,
        network: 'eip155:8453', // Base chain ID
        amount: '10000',
        payTo: '0x1234567890123456789012345678901234567890',
        maxTimeoutSeconds: 60,
        asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      },
    ],
    resourceInfo: {
      resource: 'https://api.example.com/endpoint',
      description: 'A test API endpoint',
      mimeType: 'application/json',
      outputSchema: {
        input: {
          type: 'http',
          method: 'GET' as const,
          queryParams: {
            query: { type: 'string', description: 'Search query', required: true },
          },
        },
        output: {
          results: { type: 'array', description: 'Search results' },
        },
      },
    },
  },
  withPostBody: {
    x402Version: 2,
    accepts: [
      {
        scheme: 'exact' as const,
        network: 'eip155:8453',
        amount: '50000',
        payTo: '0xabcdef1234567890abcdef1234567890abcdef12',
        maxTimeoutSeconds: 300,
        asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      },
    ],
    resourceInfo: {
      resource: 'https://api.example.com/submit',
      description: 'Submit data endpoint',
      mimeType: 'application/json',
      outputSchema: {
        input: {
          type: 'http',
          method: 'POST' as const,
          bodyType: 'json' as const,
          bodyFields: {
            message: { type: 'string', description: 'User message', required: true },
            context: { type: 'object', description: 'Optional context' },
          },
        },
        output: {
          id: { type: 'string', description: 'Response ID' },
          status: { type: 'string', description: 'Processing status' },
        },
      },
    },
  },
  withSolana: {
    x402Version: 2,
    accepts: [
      {
        scheme: 'exact' as const,
        network: 'solana',
        amount: '1000000',
        payTo: '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV',
        maxTimeoutSeconds: 120,
        asset: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC on Solana
      },
    ],
    resourceInfo: {
      resource: 'https://api.solana-example.com/data',
      description: 'Solana data endpoint',
    },
  },
  withMultipleAccepts: {
    x402Version: 2,
    accepts: [
      {
        scheme: 'exact' as const,
        network: 'eip155:8453',
        amount: '10000',
        payTo: '0x1234567890123456789012345678901234567890',
        maxTimeoutSeconds: 60,
        asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      },
      {
        scheme: 'exact' as const,
        network: 'solana',
        amount: '10000',
        payTo: '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV',
        maxTimeoutSeconds: 60,
        asset: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      },
    ],
    resourceInfo: {
      resource: 'https://api.multi-chain.com/endpoint',
      description: 'Multi-chain endpoint',
    },
  },
  withError: {
    x402Version: 2,
    error: 'X-PAYMENT header is required',
    accepts: [
      {
        scheme: 'exact' as const,
        network: 'eip155:8453',
        amount: '10000',
        payTo: '0x1234567890123456789012345678901234567890',
        maxTimeoutSeconds: 60,
        asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      },
    ],
  },
  minimal: {
    x402Version: 2,
    accepts: [
      {
        scheme: 'exact' as const,
        network: 'eip155:1', // Ethereum mainnet
        amount: '100',
        payTo: '0x1234567890123456789012345678901234567890',
        maxTimeoutSeconds: 30,
        asset: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC on mainnet
      },
    ],
  },
};

describe('parseV2', () => {
  it('should parse basic V2 response with GET endpoint', () => {
    const result = parseV2(v2Responses.basic);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.x402Version).toBe(2);
      expect(result.data.accepts).toHaveLength(1);
      expect(result.data.accepts?.[0]?.amount).toBe('10000');
      expect(result.data.accepts?.[0]?.network).toBe('eip155:8453');
      expect(result.data.resourceInfo?.resource).toBe('https://api.example.com/endpoint');
      expect(result.data.resourceInfo?.description).toBe('A test API endpoint');
      expect(result.data.resourceInfo?.outputSchema?.input.method).toBe('GET');
      expect(result.data.resourceInfo?.outputSchema?.input.queryParams?.query).toBeDefined();
    }
  });

  it('should parse V2 response with POST body fields', () => {
    const result = parseV2(v2Responses.withPostBody);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.resourceInfo?.outputSchema?.input.method).toBe('POST');
      expect(result.data.resourceInfo?.outputSchema?.input.bodyType).toBe('json');
      expect(result.data.resourceInfo?.outputSchema?.input.bodyFields?.message).toBeDefined();
      expect(result.data.resourceInfo?.outputSchema?.output?.id).toBeDefined();
    }
  });

  it('should parse V2 response with Solana network', () => {
    const result = parseV2(v2Responses.withSolana);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accepts?.[0]?.network).toBe('solana');
      expect(result.data.accepts?.[0]?.amount).toBe('1000000');
    }
  });

  it('should parse V2 response with multiple accepts (multi-chain)', () => {
    const result = parseV2(v2Responses.withMultipleAccepts);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accepts).toHaveLength(2);
      expect(result.data.accepts?.[0]?.network).toBe('eip155:8453');
      expect(result.data.accepts?.[1]?.network).toBe('solana');
    }
  });

  it('should parse V2 response with error field', () => {
    const result = parseV2(v2Responses.withError);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.error).toBe('X-PAYMENT header is required');
      expect(result.data.accepts).toHaveLength(1);
    }
  });

  it('should parse minimal V2 response without resourceInfo', () => {
    const result = parseV2(v2Responses.minimal);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.x402Version).toBe(2);
      expect(result.data.resourceInfo).toBeUndefined();
      expect(result.data.accepts).toHaveLength(1);
    }
  });

  it('should return error for invalid network format', () => {
    const invalidResponse = {
      x402Version: 2,
      accepts: [
        {
          scheme: 'exact',
          network: 'base', // Invalid - V2 requires chain ID format
          amount: '10000',
          payTo: '0x1234567890123456789012345678901234567890',
          maxTimeoutSeconds: 60,
          asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        },
      ],
    };

    const result = parseV2(invalidResponse);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it('should return error for V1 version number', () => {
    const v1Response = {
      x402Version: 1,
      accepts: [
        {
          scheme: 'exact',
          network: 'eip155:8453',
          amount: '10000',
          payTo: '0x1234567890123456789012345678901234567890',
          maxTimeoutSeconds: 60,
          asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        },
      ],
    };

    const result = parseV2(v1Response);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some(e => e.includes('x402Version'))).toBe(true);
    }
  });

  it('should return error for invalid data', () => {
    const result = parseV2({ invalid: 'data' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it('should return error for null input', () => {
    const result = parseV2(null);

    expect(result.success).toBe(false);
  });

  it('should return error for undefined input', () => {
    const result = parseV2(undefined);

    expect(result.success).toBe(false);
  });

  it('should handle empty accepts array', () => {
    const response = {
      x402Version: 2,
      accepts: [],
    };

    const result = parseV2(response);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accepts).toHaveLength(0);
    }
  });

  it('should preserve extra fields in accepts', () => {
    const response = {
      x402Version: 2,
      accepts: [
        {
          scheme: 'exact' as const,
          network: 'eip155:8453',
          amount: '10000',
          payTo: '0x1234567890123456789012345678901234567890',
          maxTimeoutSeconds: 60,
          asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          extra: {
            name: 'USD Coin',
            version: '2',
            customField: 'custom value',
          },
        },
      ],
    };

    const result = parseV2(response);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accepts?.[0]?.extra?.name).toBe('USD Coin');
      expect(result.data.accepts?.[0]?.extra?.customField).toBe('custom value');
    }
  });
});

describe('V2 schema validation edge cases', () => {
  it('should handle nested object fields in bodyFields', () => {
    const response = {
      x402Version: 2,
      accepts: [
        {
          scheme: 'exact' as const,
          network: 'eip155:8453',
          amount: '10000',
          payTo: '0x1234567890123456789012345678901234567890',
          maxTimeoutSeconds: 60,
          asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        },
      ],
      resourceInfo: {
        resource: 'https://api.example.com/endpoint',
        outputSchema: {
          input: {
            type: 'http',
            method: 'POST' as const,
            bodyType: 'json' as const,
            bodyFields: {
              data: {
                type: 'object',
                properties: {
                  name: { type: 'string', required: true },
                  value: { type: 'number' },
                },
              },
            },
          },
        },
      },
    };

    const result = parseV2(response);

    expect(result.success).toBe(true);
    if (result.success) {
      const bodyFields = result.data.resourceInfo?.outputSchema?.input.bodyFields;
      expect(bodyFields?.data).toBeDefined();
    }
  });

  it('should handle array fields with items schema', () => {
    const response = {
      x402Version: 2,
      accepts: [
        {
          scheme: 'exact' as const,
          network: 'eip155:8453',
          amount: '10000',
          payTo: '0x1234567890123456789012345678901234567890',
          maxTimeoutSeconds: 60,
          asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        },
      ],
      resourceInfo: {
        resource: 'https://api.example.com/endpoint',
        outputSchema: {
          input: {
            type: 'http',
            method: 'POST' as const,
            bodyType: 'json' as const,
            bodyFields: {
              messages: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    role: { type: 'string', enum: ['user', 'assistant'] },
                    content: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    };

    const result = parseV2(response);

    expect(result.success).toBe(true);
    if (result.success) {
      const bodyFields = result.data.resourceInfo?.outputSchema?.input.bodyFields;
      expect(bodyFields?.messages).toBeDefined();
    }
  });

  it('should validate solana-devnet network', () => {
    const response = {
      x402Version: 2,
      accepts: [
        {
          scheme: 'exact' as const,
          network: 'solana-devnet',
          amount: '10000',
          payTo: '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV',
          maxTimeoutSeconds: 60,
          asset: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        },
      ],
    };

    const result = parseV2(response);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accepts?.[0]?.network).toBe('solana-devnet');
    }
  });
});
