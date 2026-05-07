import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Result } from 'better-result';
import type { EndpointMethodAdvisory } from '@agentcash/discovery';

// Mock side-effecting modules. The tests focus on registerResource's error
// dispatch — they don't exercise origin scraping, db writes, or notifications.
vi.mock('@/services/scraper', () => ({
  scrapeOriginData: vi.fn().mockResolvedValue({
    og: undefined,
    metadata: undefined,
    favicon: undefined,
    origin: 'https://api.example.com',
  }),
}));

vi.mock('@/services/db/resources/origin', () => ({
  getOriginResourceCount: vi.fn().mockResolvedValue(1),
  upsertOrigin: vi.fn().mockResolvedValue(undefined),
}));

const upsertResourceMock = vi.fn();
vi.mock('@/services/db/resources/resource', () => ({
  upsertResource: (args: unknown): unknown => upsertResourceMock(args),
}));

vi.mock('@/services/db/resources/response', () => ({
  upsertResourceResponse: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/services/discovery', () => ({
  fetchDiscoveryDocument: vi
    .fn()
    .mockResolvedValue({ success: false, resources: [], error: 'none' }),
}));

vi.mock('@/services/verification/accepts-verification', () => ({
  verifyAcceptsOwnership: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/discord-notifications', () => ({
  notifyNewServer: vi.fn(),
}));

import { registerResource } from './resources';

beforeEach(() => {
  upsertResourceMock.mockReset();
  // Default: a resource with one accept on Base.
  upsertResourceMock.mockResolvedValue({
    resource: {
      id: 'r1',
      resource: 'https://api.example.com/pay',
      type: 'http',
      x402Version: 1,
      lastUpdated: new Date(),
      deprecatedAt: null,
      originId: 'o1',
      metadata: {},
    },
    accepts: [
      {
        id: 'a1',
        scheme: 'exact',
        network: 'base',
        maxAmountRequired: 100n,
        payTo: '0xpayee',
        asset: '0xasset',
        maxTimeoutSeconds: 60,
        outputSchema: null,
        extra: null,
        resourceId: 'r1',
        verified: false,
        verifiedAddress: null,
        verificationProof: null,
        verifiedAt: null,
      },
    ],
    origin: { id: 'o1', origin: 'https://api.example.com' },
    unsupportedAccepts: [],
  });
});

const url = 'https://api.example.com/pay';

const baseAdvisory: EndpointMethodAdvisory = {
  method: 'POST',
  paymentOptions: [
    {
      protocol: 'x402',
      version: 1,
      network: 'eip155:8453', // base
      asset: '0xUSDC',
      maxAmountRequired: '100',
      payTo: '0xpayee',
    },
  ],
  inputSchema: { type: 'object', properties: {} },
} as unknown as EndpointMethodAdvisory;

describe('registerResource error dispatch', () => {
  it('returns NoPaymentOptions when no x402 options are advertised', async () => {
    const advisory = {
      ...baseAdvisory,
      paymentOptions: [],
    } as unknown as EndpointMethodAdvisory;
    const result = await registerResource(url, advisory);
    expect(Result.isError(result)).toBe(true);
    if (Result.isError(result))
      expect(result.error._tag).toBe('NoPaymentOptions');
  });

  it('returns MissingInputSchema when inputSchema is absent', async () => {
    const advisory = {
      ...baseAdvisory,
      inputSchema: undefined,
    } as unknown as EndpointMethodAdvisory;
    const result = await registerResource(url, advisory);
    expect(Result.isError(result)).toBe(true);
    if (Result.isError(result)) {
      expect(result.error._tag).toBe('MissingInputSchema');
      if (result.error._tag === 'MissingInputSchema') {
        expect(result.error.method).toBe('POST');
      }
    }
  });

  it('returns UnsupportedNetwork when only testnets are advertised', async () => {
    const advisory = {
      ...baseAdvisory,
      paymentOptions: [
        {
          protocol: 'x402',
          version: 1,
          network: 'solana:devnet',
          asset: 'USDC',
          maxAmountRequired: '100',
          payTo: 'sol-payee',
        },
      ],
    } as unknown as EndpointMethodAdvisory;
    const result = await registerResource(url, advisory);
    expect(Result.isError(result)).toBe(true);
    if (Result.isError(result)) {
      expect(result.error._tag).toBe('UnsupportedNetwork');
      if (result.error._tag === 'UnsupportedNetwork') {
        expect(result.error.advertisedNetworks).toContain('solana_devnet');
        expect(result.error.supportedNetworks).toEqual(
          expect.arrayContaining(['base', 'solana'])
        );
      }
    }
  });

  it('returns ResourceUpsertFailed when upsertResource returns null', async () => {
    upsertResourceMock.mockResolvedValueOnce(undefined);
    const result = await registerResource(url, baseAdvisory);
    expect(Result.isError(result)).toBe(true);
    if (Result.isError(result))
      expect(result.error._tag).toBe('ResourceUpsertFailed');
  });

  it('returns Ok with formatted accepts on success', async () => {
    const result = await registerResource(url, baseAdvisory);
    expect(Result.isOk(result)).toBe(true);
    if (Result.isOk(result)) {
      expect(result.value.resource.resource.resource).toBe(
        'https://api.example.com/pay'
      );
      expect(result.value.accepts).toHaveLength(1);
      // formatTokenAmount converts the bigint to a string.
      expect(typeof result.value.accepts[0]?.maxAmountRequired).toBe('string');
    }
  });
});
