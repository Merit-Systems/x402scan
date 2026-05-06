import { describe, expect, it } from 'vitest';

import { upsertResourceSchema } from './resource-schema';

describe('upsertResourceSchema', () => {
  it('accepts non-exact x402 schemes for supported networks', () => {
    const result = upsertResourceSchema.safeParse({
      resource: 'https://api.example.com/upto',
      type: 'http',
      x402Version: 2,
      lastUpdated: new Date(),
      accepts: [
        {
          scheme: 'upto',
          network: 'eip155:8453',
          payTo: '0x1234567890123456789012345678901234567890',
          description: 'Up to priced endpoint',
          maxAmountRequired: '10000',
          mimeType: 'application/json',
          maxTimeoutSeconds: 60,
          asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        },
      ],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accepts[0]?.scheme).toBe('upto');
      expect(result.data.accepts[0]?.network).toBe('base');
    }
  });

  // Regression: stable-apartment.vercel.app advertised a payTo with valid hex
  // but invalid EIP-55 checksum. viem's isAddress defaults to strict checksum
  // validation, which rejected it and surfaced as `database: Resource failed
  // to upsert` because upsertResource silently returns undefined on parse
  // failure. Accept hex-valid addresses regardless of casing.
  it('accepts EVM payTo with non-checksum (mixed-case) hex', () => {
    const result = upsertResourceSchema.safeParse({
      resource: 'https://stable-apartment.vercel.app/api/markets',
      type: 'http',
      x402Version: 2,
      lastUpdated: new Date(),
      accepts: [
        {
          scheme: 'exact',
          network: 'eip155:8453',
          payTo: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
          maxAmountRequired: '10000',
          maxTimeoutSeconds: 300,
          asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        },
      ],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accepts[0]?.payTo).toBe(
        '0x742d35cc6634c0532925a3b844bc9e7595f2bd18'
      );
    }
  });

  // Regression: agentcash.dev/api/send advertises Solana mainnet using the
  // canonical CAIP-2 genesis-hash identifier. registerResource normalizes via
  // normalizeChainId, but other callers (e.g. /api/resources/sync) feed raw
  // network strings through to the schema. Without a Solana-CAIP-2 branch the
  // accepts row was silently dropped and the resource surfaced as
  // `database: Resource failed to upsert`.
  it('accepts Solana CAIP-2 mainnet (5eykt4...) and normalizes to solana', () => {
    const result = upsertResourceSchema.safeParse({
      resource: 'https://agentcash.dev/api/send',
      type: 'http',
      x402Version: 2,
      lastUpdated: new Date(),
      accepts: [
        {
          scheme: 'exact',
          network: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          payTo: 'AepWpq3GQwL8CeKMtZyKtKPa7W91Coygh3ropAJapVdU',
          maxAmountRequired: '1',
          maxTimeoutSeconds: 300,
          asset: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        },
      ],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accepts[0]?.network).toBe('solana');
    }
  });

  it('accepts Solana CAIP-2 devnet identifiers', () => {
    for (const id of ['solana:devnet', 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1']) {
      const result = upsertResourceSchema.safeParse({
        resource: 'https://example.com/x',
        type: 'http',
        x402Version: 2,
        lastUpdated: new Date(),
        accepts: [
          {
            scheme: 'exact',
            network: id,
            payTo: 'AepWpq3GQwL8CeKMtZyKtKPa7W91Coygh3ropAJapVdU',
            maxAmountRequired: '1',
            maxTimeoutSeconds: 300,
            asset: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          },
        ],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.accepts[0]?.network).toBe('solana_devnet');
      }
    }
  });

  it('rejects unknown solana CAIP-2 suffixes (not silently)', () => {
    const result = upsertResourceSchema.safeParse({
      resource: 'https://example.com/x',
      type: 'http',
      x402Version: 2,
      lastUpdated: new Date(),
      accepts: [
        {
          scheme: 'exact',
          network: 'solana:not-a-real-cluster',
          payTo: 'AepWpq3GQwL8CeKMtZyKtKPa7W91Coygh3ropAJapVdU',
          maxAmountRequired: '1',
          maxTimeoutSeconds: 300,
          asset: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        },
      ],
    });

    expect(result.success).toBe(false);
  });
});
