import { describe, expect, it, vi } from 'vitest';

async function loadUpsertOriginWithMocks() {
  vi.resetModules();

  const tx = {
    resourceOrigin: {
      upsert: vi.fn().mockResolvedValue({
        id: 'origin-id',
      }),
      findUnique: vi.fn().mockResolvedValue({
        id: 'origin-id',
        origin: 'https://example.com',
        ogImages: [],
      }),
    },
    ogImage: {
      upsert: vi.fn().mockResolvedValue(undefined),
    },
  };

  const scanDb = {
    $transaction: vi.fn(
      async (callback: (db: typeof tx) => unknown) =>
        await Promise.resolve(callback(tx))
    ),
  };

  vi.doMock('@x402scan/scan-db', () => ({ scanDb }));
  vi.doMock('@/lib/x402', () => ({
    parseX402Response: vi.fn(),
  }));

  const { upsertOrigin } = await import('./origin');

  return { tx, upsertOrigin };
}

describe('upsertOrigin', () => {
  it('deduplicates og images by url before upserting', async () => {
    const { tx, upsertOrigin } = await loadUpsertOriginWithMocks();

    await upsertOrigin({
      origin: 'https://example.com',
      ogImages: [
        {
          url: 'https://cdn.example.com/og.png',
          width: 1200,
          title: 'first',
        },
        {
          url: 'https://cdn.example.com/og.png',
          width: 2400,
          title: 'second',
        },
      ],
    });

    expect(tx.ogImage.upsert).toHaveBeenCalledTimes(1);
    expect(tx.ogImage.upsert).toHaveBeenCalledWith({
      where: {
        originId_url: {
          originId: 'origin-id',
          url: 'https://cdn.example.com/og.png',
        },
      },
      update: {
        height: undefined,
        width: 2400,
        title: 'second',
        description: undefined,
      },
      create: {
        originId: 'origin-id',
        url: 'https://cdn.example.com/og.png',
        height: undefined,
        width: 2400,
        title: 'second',
        description: undefined,
      },
    });
  });

  it('upserts og images sequentially to avoid unique constraint races', async () => {
    const { tx, upsertOrigin } = await loadUpsertOriginWithMocks();

    let inFlight = 0;
    let maxInFlight = 0;

    tx.ogImage.upsert.mockImplementation(async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise(resolve => setTimeout(resolve, 1));
      inFlight -= 1;
    });

    await upsertOrigin({
      origin: 'https://example.com',
      ogImages: [
        { url: 'https://cdn.example.com/og-1.png' },
        { url: 'https://cdn.example.com/og-2.png' },
      ],
    });

    expect(tx.ogImage.upsert).toHaveBeenCalledTimes(2);
    expect(maxInFlight).toBe(1);
  });
});
