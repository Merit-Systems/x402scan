import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  ogImageUpsert: vi.fn(),
  resourceOriginFindUnique: vi.fn(),
  resourceOriginUpsert: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('@x402scan/scan-db', () => ({
  scanDb: {
    $transaction: db.transaction,
  },
}));

import { upsertOrigin } from './origin';

interface MockTransactionClient {
  ogImage: {
    upsert: typeof db.ogImageUpsert;
  };
  resourceOrigin: {
    findUnique: typeof db.resourceOriginFindUnique;
    upsert: typeof db.resourceOriginUpsert;
  };
}

type MockTransactionCallback = (
  transactionClient: MockTransactionClient
) => unknown;

describe('upsertOrigin', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    db.resourceOriginUpsert.mockResolvedValue({ id: 'origin-1' });
    db.ogImageUpsert.mockResolvedValue({});
    db.resourceOriginFindUnique.mockResolvedValue({
      id: 'origin-1',
      ogImages: [],
    });
    db.transaction.mockImplementation((callback: MockTransactionCallback) =>
      Promise.resolve(
        callback({
          ogImage: {
            upsert: db.ogImageUpsert,
          },
          resourceOrigin: {
            findUnique: db.resourceOriginFindUnique,
            upsert: db.resourceOriginUpsert,
          },
        })
      )
    );
  });

  it('upserts each OG image URL once per origin', async () => {
    await upsertOrigin({
      origin: 'https://example.com',
      ogImages: [
        {
          url: 'https://cdn.example.com/og.png',
          height: 100,
          width: 200,
          title: 'First image',
        },
        {
          url: 'https://cdn.example.com/og.png',
          height: 300,
          width: 400,
          title: 'Updated image',
        },
      ],
    });

    expect(db.ogImageUpsert).toHaveBeenCalledTimes(1);
    expect(db.ogImageUpsert).toHaveBeenCalledWith({
      where: {
        originId_url: {
          originId: 'origin-1',
          url: 'https://cdn.example.com/og.png',
        },
      },
      update: {
        description: undefined,
        height: 300,
        title: 'Updated image',
        width: 400,
      },
      create: {
        description: undefined,
        height: 300,
        originId: 'origin-1',
        title: 'Updated image',
        url: 'https://cdn.example.com/og.png',
        width: 400,
      },
    });
  });
});
