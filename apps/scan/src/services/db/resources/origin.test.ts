import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Mock } from 'vitest';

import { scanDb } from '@x402scan/scan-db';

import { upsertOrigin } from './origin';

vi.mock('@x402scan/scan-db', () => ({
  scanDb: {
    $transaction: vi.fn(),
  },
}));

interface OriginRecord {
  id: string;
  origin: string;
  title?: string;
  description?: string;
  favicon?: string;
}

interface OgImageRecord {
  originId: string;
  url: string;
  height?: number;
  width?: number;
  title?: string;
  description?: string;
}

interface ResourceOriginUpsertArgs {
  where: { origin: string };
  create: Omit<OriginRecord, 'id'>;
  update: Partial<Omit<OriginRecord, 'id'>>;
}

interface ResourceOriginFindUniqueArgs {
  where: { id: string };
}

interface OgImageUpsertArgs {
  where: {
    originId_url: {
      originId: string;
      url: string;
    };
  };
  create: OgImageRecord;
  update: Partial<OgImageRecord>;
}

interface TestTransaction {
  resourceOrigin: {
    upsert: Mock<(args: ResourceOriginUpsertArgs) => Promise<OriginRecord>>;
    findUnique: Mock<
      (
        args: ResourceOriginFindUniqueArgs
      ) => Promise<(OriginRecord & { ogImages: OgImageRecord[] }) | null>
    >;
  };
  ogImage: {
    upsert: Mock<(args: OgImageUpsertArgs) => Promise<OgImageRecord>>;
  };
}

type TransactionMock = Mock<
  (
    callback: (transactionClient: TestTransaction) => Promise<unknown>
  ) => Promise<unknown>
>;

describe('upsertOrigin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows different origins to reference the same OG image URL', async () => {
    const origins = new Map<string, OriginRecord>();
    const ogImages = new Map<string, OgImageRecord>();
    let nextOriginId = 1;

    const tx: TestTransaction = {
      resourceOrigin: {
        upsert: vi.fn((args: ResourceOriginUpsertArgs) => {
          const { where, create, update } = args;
          const existing = origins.get(where.origin);
          if (existing) {
            const updated = { ...existing, ...update };
            origins.set(where.origin, updated);
            return Promise.resolve(updated);
          }

          const created = { id: `origin-${nextOriginId++}`, ...create };
          origins.set(where.origin, created);
          return Promise.resolve(created);
        }),
        findUnique: vi.fn((args: ResourceOriginFindUniqueArgs) => {
          const { where } = args;
          const origin = [...origins.values()].find(
            ({ id }) => id === where.id
          );

          if (!origin) return Promise.resolve(null);

          return Promise.resolve({
            ...origin,
            ogImages: [...ogImages.values()].filter(
              ({ originId }) => originId === origin.id
            ),
          });
        }),
      },
      ogImage: {
        upsert: vi.fn((args: OgImageUpsertArgs) => {
          const { where, create, update } = args;
          const key = `${where.originId_url.originId}:${where.originId_url.url}`;
          const existing = ogImages.get(key);

          if (existing) {
            const updated = { ...existing, ...update };
            ogImages.set(key, updated);
            return Promise.resolve(updated);
          }

          ogImages.set(key, create);
          return Promise.resolve(create);
        }),
      },
    };

    const scanDbMock = scanDb as unknown as { $transaction: TransactionMock };
    const transactionMock = scanDbMock.$transaction;
    transactionMock.mockImplementation(
      async (callback: (transactionClient: typeof tx) => Promise<unknown>) =>
        callback(tx)
    );

    const sharedOgImage = {
      url: 'https://cdn.example.com/shared-og.png',
      width: 1200,
      height: 630,
    };

    await upsertOrigin({
      origin: 'https://first.example.com',
      ogImages: [sharedOgImage],
    });

    const secondOrigin = await upsertOrigin({
      origin: 'https://second.example.com',
      ogImages: [sharedOgImage],
    });

    expect(secondOrigin?.ogImages).toMatchObject([sharedOgImage]);
    expect(tx.ogImage.upsert.mock.calls).toContainEqual([
      expect.objectContaining({
        where: {
          originId_url: {
            originId: 'origin-2',
            url: sharedOgImage.url,
          },
        },
      }),
    ]);
    expect(ogImages.size).toBe(2);
  });
});
