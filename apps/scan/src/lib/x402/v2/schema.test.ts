/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { describe, it, expect } from 'vitest';
import { parseX402Response, isV2Response } from '../index';

// Helper to parse and narrow to V2 type for tests
function parseV2(data: unknown) {
  const result = parseX402Response(data);
  if (!result.success) {
    return result;
  }
  if (!isV2Response(result.data)) {
    return { success: false as const, errors: ['Not a V2 response'] };
  }
  return { success: true as const, data: result.data };
}

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
        extra: {},
      },
    ],
    resource: {
      url: 'https://api.example.com/endpoint',
      description: 'A test API endpoint',
      mimeType: 'application/json',
    },
    extensions: {
      bazaar: {
        info: {
          input: {
            type: 'http',
            method: 'GET',
            queryParams: {
              query: 'example search',
            },
          },
          output: {
            results: [],
          },
        },
        schema: {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          type: 'object',
          properties: {
            input: {
              type: 'object',
              properties: {
                queryParams: {
                  type: 'object',
                  properties: {
                    query: {
                      type: 'string',
                      description: 'Search query',
                    },
                  },
                  required: ['query'],
                },
              },
            },
          },
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
        extra: {},
      },
    ],
    resource: {
      url: 'https://api.example.com/submit',
      description: 'Submit data endpoint',
      mimeType: 'application/json',
    },
    extensions: {
      bazaar: {
        info: {
          input: {
            type: 'http',
            method: 'POST',
            bodyType: 'json',
            body: {
              message: 'Hello world',
            },
          },
          output: {
            id: 'abc123',
            status: 'success',
          },
        },
        schema: {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          type: 'object',
          properties: {
            input: {
              type: 'object',
              properties: {
                body: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      description: 'User message',
                    },
                    context: {
                      type: 'object',
                      description: 'Optional context',
                    },
                  },
                  required: ['message'],
                },
              },
            },
          },
        },
      },
    },
  },
  withSolana: {
    x402Version: 2,
    accepts: [
      {
        scheme: 'exact' as const,
        network: 'solana:mainnet',
        amount: '1000000',
        payTo: '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV',
        maxTimeoutSeconds: 120,
        asset: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC on Solana
        extra: {},
      },
    ],
    resource: {
      url: 'https://api.solana-example.com/data',
      description: 'Solana data endpoint',
      mimeType: 'application/json',
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
        extra: {},
      },
      {
        scheme: 'exact' as const,
        network: 'solana:mainnet',
        amount: '10000',
        payTo: '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV',
        maxTimeoutSeconds: 60,
        asset: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        extra: {},
      },
    ],
    resource: {
      url: 'https://api.multi-chain.com/endpoint',
      description: 'Multi-chain endpoint',
      mimeType: 'application/json',
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
        extra: {},
      },
    ],
    resource: {
      url: 'https://api.example.com/error',
      description: 'Error endpoint',
      mimeType: 'application/json',
    },
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
        extra: {},
      },
    ],
    resource: {
      url: 'https://api.minimal.com/endpoint',
      description: 'Minimal endpoint',
      mimeType: 'application/json',
    },
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
      expect(result.data.resource?.url).toBe(
        'https://api.example.com/endpoint'
      );
      expect(result.data.resource?.description).toBe('A test API endpoint');
      // V2: schema comes from extensions.bazaar, not resource.outputSchema
      expect(result.data.extensions?.bazaar?.info?.input.method).toBe('GET');
      expect(
        result.data.extensions?.bazaar?.schema?.properties?.input?.properties
          ?.queryParams
      ).toBeDefined();
    }
  });

  it('should parse V2 response with POST body fields', () => {
    const result = parseV2(v2Responses.withPostBody);

    expect(result.success).toBe(true);
    if (result.success) {
      // V2: schema comes from extensions.bazaar, not resource.outputSchema
      expect(result.data.extensions?.bazaar?.info?.input.method).toBe('POST');
      expect(result.data.extensions?.bazaar?.info?.input.bodyType).toBe('json');
      expect(
        result.data.extensions?.bazaar?.schema?.properties?.input?.properties
          ?.body?.properties?.message
      ).toBeDefined();
      expect(result.data.extensions?.bazaar?.info?.output?.id).toBeDefined();
    }
  });

  it('should parse V2 response with Solana network', () => {
    const result = parseV2(v2Responses.withSolana);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accepts?.[0]?.network).toBe('solana:mainnet');
      expect(result.data.accepts?.[0]?.amount).toBe('1000000');
    }
  });

  it('should parse V2 response with multiple accepts (multi-chain)', () => {
    const result = parseV2(v2Responses.withMultipleAccepts);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accepts).toHaveLength(2);
      expect(result.data.accepts?.[0]?.network).toBe('eip155:8453');
      expect(result.data.accepts?.[1]?.network).toBe('solana:mainnet');
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

  it('should parse minimal V2 response without resource', () => {
    const result = parseV2(v2Responses.minimal);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.x402Version).toBe(2);
      expect(result.data.resource?.url).toBe(
        'https://api.minimal.com/endpoint'
      );
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
  it('should handle nested object fields in bazaar schema', () => {
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
          extra: {},
        },
      ],
      resource: {
        url: 'https://api.example.com/endpoint',
        description: 'Test endpoint',
        mimeType: 'application/json',
      },
      extensions: {
        bazaar: {
          info: {
            input: {
              type: 'http',
              method: 'POST',
              bodyType: 'json',
              body: { data: { name: 'test', value: 42 } },
            },
          },
          schema: {
            type: 'object',
            properties: {
              input: {
                type: 'object',
                properties: {
                  body: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          value: { type: 'number' },
                        },
                        required: ['name'],
                      },
                    },
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
      const bodySchema =
        result.data.extensions?.bazaar?.schema?.properties?.input?.properties
          ?.body?.properties?.data;
      expect(bodySchema).toBeDefined();
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
          extra: {},
        },
      ],
      resource: {
        url: 'https://api.example.com/endpoint',
        description: 'Test endpoint',
        mimeType: 'application/json',
      },
      extensions: {
        bazaar: {
          info: {
            input: {
              type: 'http',
              method: 'POST',
              bodyType: 'json',
              body: {
                messages: [{ role: 'user', content: 'Hello' }],
              },
            },
          },
          schema: {
            type: 'object',
            properties: {
              input: {
                type: 'object',
                properties: {
                  body: {
                    type: 'object',
                    properties: {
                      messages: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            role: {
                              type: 'string',
                              enum: ['user', 'assistant'],
                            },
                            content: { type: 'string' },
                          },
                        },
                      },
                    },
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
      const messagesSchema =
        result.data.extensions?.bazaar?.schema?.properties?.input?.properties
          ?.body?.properties?.messages;
      expect(messagesSchema).toBeDefined();
    }
  });

  it('should accept resource without mimeType', () => {
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
          extra: {},
        },
      ],
      resource: {
        url: 'https://api.example.com/endpoint',
        description: 'Endpoint without mimeType',
      },
    };

    const result = parseV2(response);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.resource?.mimeType).toBeUndefined();
    }
  });

  it('should validate solana-devnet network', () => {
    const response = {
      x402Version: 2,
      accepts: [
        {
          scheme: 'exact' as const,
          network: 'solana:devnet',
          amount: '10000',
          payTo: '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV',
          maxTimeoutSeconds: 60,
          asset: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          extra: {},
        },
      ],
      resource: {
        url: 'https://api.solana-devnet.com/endpoint',
        description: 'Solana devnet endpoint',
        mimeType: 'application/json',
      },
    };

    const result = parseV2(response);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accepts?.[0]?.network).toBe('solana:devnet');
    }
  });
});
