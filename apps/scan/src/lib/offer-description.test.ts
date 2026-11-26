import { describe, expect, it, vi } from 'vitest';

// resources.ts imports the database and notification clients; the helper under test uses
// neither, so they are stubbed out to keep this a pure unit test.
vi.mock('@x402scan/scan-db', () => ({ scanDb: {} }));
vi.mock('@/services/db/resources/resource', () => ({}));
vi.mock('@/services/db/resources/origin', () => ({}));
vi.mock('@/lib/discord-notifications', () => ({}));
vi.mock('@/services/scraper', () => ({}));

import { getOfferDescription } from './resources';

const accept = {
  scheme: 'exact',
  network: 'eip155:8453',
  amount: '2000',
  asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  payTo: '0x1234567890123456789012345678901234567890',
  maxTimeoutSeconds: 300,
  extra: { name: 'USD Coin', version: '2' },
};

describe('getOfferDescription', () => {
  it('reads a v2 offer description from resource.description', () => {
    const body = {
      x402Version: 2,
      resource: {
        url: 'https://api.example.com/read',
        description:
          'Web page to Markdown: read any public URL as clean Markdown.',
        mimeType: 'application/json',
      },
      accepts: [accept],
    };
    expect(getOfferDescription(body, 'discovery fallback')).toBe(
      'Web page to Markdown: read any public URL as clean Markdown.'
    );
  });

  it('reads a v1 offer description from accepts[].description', () => {
    const body = {
      x402Version: 1,
      accepts: [
        {
          scheme: 'exact',
          network: 'base',
          maxAmountRequired: '2000',
          resource: 'https://api.example.com/read',
          description: 'Read a page as Markdown',
          mimeType: 'application/json',
          payTo: accept.payTo,
          maxTimeoutSeconds: 300,
          asset: accept.asset,
        },
      ],
    };
    expect(getOfferDescription(body)).toBe('Read a page as Markdown');
  });

  it('falls back to the discovery description, then to an empty string', () => {
    const noDescription = {
      x402Version: 2,
      resource: {
        url: 'https://api.example.com/read',
        mimeType: 'application/json',
      },
      accepts: [accept],
    };
    expect(
      getOfferDescription(noDescription, 'From the OpenAPI operation')
    ).toBe('From the OpenAPI operation');
    expect(getOfferDescription(undefined, 'From discovery')).toBe(
      'From discovery'
    );
    expect(getOfferDescription(undefined)).toBe('');
    expect(getOfferDescription({ not: 'x402' })).toBe('');
  });
});
