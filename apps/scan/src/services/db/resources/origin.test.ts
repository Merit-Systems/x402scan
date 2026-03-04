import { beforeEach, describe, expect, it, vi } from 'vitest';

interface UpsertOriginRecord {
  id: string;
  origin: string;
  title?: string;
  description?: string;
  favicon?: string;
  ogImages: unknown[];
}

interface TransactionClient {
  resourceOrigin: {
    upsert: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
  };
  ogImage: {
    upsert: ReturnType<typeof vi.fn>;
  };
}

interface OgImageUpsertCall {
  where: {
    originId_url: {
      originId: string;
      url: string;
    };
  };
  create: {
    originId: string;
    url: string;
  };
}

const hoisted = vi.hoisted(() => ({
  transactionMock: vi.fn(),
}));

vi.mock('@x402scan/scan-db', () => ({
  scanDb: {
    $transaction: hoisted.transactionMock,
  },
}));

import { upsertOrigin } from './origin';

describe('upsertOrigin', () => {
  const tx: TransactionClient = {
    resourceOrigin: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
    ogImage: {
      upsert: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    hoisted.transactionMock.mockImplementation(
      async (callback: (client: TransactionClient) => Promise<UpsertOriginRecord | null>) => {
        return await callback(tx);
      }
    );

    tx.resourceOrigin.upsert.mockResolvedValue({ id: 'origin-id' });
    tx.ogImage.upsert.mockResolvedValue(undefined);
    tx.resourceOrigin.findUnique.mockResolvedValue({
      id: 'origin-id',
      origin: 'https://example.com',
      title: 'Example',
      description: 'Description',
      favicon: 'https://example.com/favicon.ico',
      ogImages: [],
    });
  });

  it('upserts OG images per origin and does not use nested ogImages.create', async () => {
    await upsertOrigin({
      origin: 'https://example.com',
      title: 'Example',
      description: 'Description',
      favicon: 'https://example.com/favicon.ico',
      ogImages: [
        {
          url: 'https://cdn.example.com/shared-og.png',
          width: 1200,
          height: 630,
          title: 'OG title',
          description: 'OG description',
        },
        {
          url: 'https://cdn.example.com/secondary-og.png',
        },
      ],
    });

    expect(tx.resourceOrigin.upsert).toHaveBeenCalledTimes(1);
    const upsertOriginCall = tx.resourceOrigin.upsert.mock.calls[0]?.[0] as
      | { create: Record<string, unknown> }
      | undefined;
    expect(upsertOriginCall).toBeDefined();
    if (!upsertOriginCall) {
      throw new Error('resourceOrigin.upsert was not called');
    }
    expect('ogImages' in upsertOriginCall.create).toBe(false);

    expect(tx.ogImage.upsert).toHaveBeenCalledTimes(2);
    const firstOgImageUpsert = tx.ogImage.upsert.mock.calls[0]?.[0] as
      | OgImageUpsertCall
      | undefined;
    const secondOgImageUpsert = tx.ogImage.upsert.mock.calls[1]?.[0] as
      | OgImageUpsertCall
      | undefined;

    expect(firstOgImageUpsert).toBeDefined();
    expect(secondOgImageUpsert).toBeDefined();
    if (!firstOgImageUpsert || !secondOgImageUpsert) {
      throw new Error('ogImage.upsert was not called with expected arguments');
    }

    expect(firstOgImageUpsert.where.originId_url).toEqual({
      originId: 'origin-id',
      url: 'https://cdn.example.com/shared-og.png',
    });
    expect(firstOgImageUpsert.create.originId).toBe('origin-id');
    expect(firstOgImageUpsert.create.url).toBe(
      'https://cdn.example.com/shared-og.png'
    );

    expect(secondOgImageUpsert.where.originId_url).toEqual({
      originId: 'origin-id',
      url: 'https://cdn.example.com/secondary-og.png',
    });
    expect(secondOgImageUpsert.create.originId).toBe('origin-id');
    expect(secondOgImageUpsert.create.url).toBe(
      'https://cdn.example.com/secondary-og.png'
    );
  });
});
