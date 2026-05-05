import { describe, expect, it } from 'vitest';

import { upsertResourceSchema } from './resource';

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
});
