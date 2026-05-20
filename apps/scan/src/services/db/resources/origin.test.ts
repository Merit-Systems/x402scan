import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const tx = {
    resourceOrigin: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
    ogImage: {
      upsert: vi.fn(),
    },
  };

  return {
    tx,
    scanDb: {
      $transaction: vi.fn(async callback => callback(tx)),
    },
  };
});

vi.mock('@x402scan/scan-db', () => ({
  scanDb: mocks.scanDb,
}));

import { upsertOrigin } from './origin';

describe('upsertOrigin', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.tx.resourceOrigin.upsert.mockImplementation(({ where }) =>
      Promise.resolve({
        id:
          where.origin === 'https://subdomain.example.com'
            ? 'origin-subdomain'
            : 'origin-root',
      })
    );
    mocks.tx.resourceOrigin.findUnique.mockImplementation(({ where }) =>
      Promise.resolve({
        id: where.id,
        ogImages: [],
      })
    );
    mocks.tx.ogImage.upsert.mockResolvedValue({});
  });

  it('upserts shared OG image urls per origin', async () => {
    const sharedOgImageUrl = 'https://cdn.example.com/shared-og.png';

    await upsertOrigin({
      origin: 'https://subdomain.example.com',
      ogImages: [{ url: sharedOgImageUrl, width: 1200, height: 630 }],
    });

    await upsertOrigin({
      origin: 'https://example.com',
      ogImages: [{ url: sharedOgImageUrl, width: 1200, height: 630 }],
    });

    expect(mocks.tx.ogImage.upsert).toHaveBeenNthCalledWith(1, {
      where: {
        originId_url: {
          originId: 'origin-subdomain',
          url: sharedOgImageUrl,
        },
      },
      update: {
        height: 630,
        width: 1200,
        title: undefined,
        description: undefined,
      },
      create: {
        originId: 'origin-subdomain',
        url: sharedOgImageUrl,
        height: 630,
        width: 1200,
        title: undefined,
        description: undefined,
      },
    });
    expect(mocks.tx.ogImage.upsert).toHaveBeenNthCalledWith(2, {
      where: {
        originId_url: {
          originId: 'origin-root',
          url: sharedOgImageUrl,
        },
      },
      update: {
        height: 630,
        width: 1200,
        title: undefined,
        description: undefined,
      },
      create: {
        originId: 'origin-root',
        url: sharedOgImageUrl,
        height: 630,
        width: 1200,
        title: undefined,
        description: undefined,
      },
    });
  });
});
