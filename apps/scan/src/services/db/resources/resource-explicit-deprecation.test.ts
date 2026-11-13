import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  updateMany: vi.fn(),
}));

vi.mock('@x402scan/scan-db', () => ({
  scanDb: {
    resources: {
      findMany: mocks.findMany,
      updateMany: mocks.updateMany,
    },
  },
}));

vi.mock('@/lib/cache', () => ({
  createCachedArrayQuery: vi.fn(),
  createCachedPaginatedQuery: vi.fn(),
  createStandardCacheKey: vi.fn(),
}));

vi.mock('./origin', () => ({
  ensureOriginExists: vi.fn(),
  freeAuthModeFilters: [],
}));

import { deprecateExplicitlyExcludedResources } from './resource';

describe('deprecateExplicitlyExcludedResources', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates only the exact active METHOD+URL identities that were explicitly excluded', async () => {
    mocks.findMany.mockResolvedValue([{ id: 'res-a' }, { id: 'res-b' }]);
    mocks.updateMany.mockResolvedValue({ count: 2 });

    const count = await deprecateExplicitlyExcludedResources([
      { url: 'https://merchant.example/v1/a', method: 'GET' },
      { url: 'https://merchant.example/v1/b', method: 'POST' },
      { url: 'https://merchant.example/v1/a', method: 'GET' },
    ]);

    expect(mocks.findMany).toHaveBeenCalledWith({
      where: {
        deprecatedAt: null,
        OR: [
          {
            resource: 'https://merchant.example/v1/a',
            method: 'GET',
          },
          {
            resource: 'https://merchant.example/v1/b',
            method: 'POST',
          },
        ],
      },
      select: { id: true },
    });
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['res-a', 'res-b'] } },
      data: { deprecatedAt: expect.any(Date) },
    });
    expect(count).toBe(2);
  });

  it('does nothing when there are no trusted exclusions', async () => {
    const count = await deprecateExplicitlyExcludedResources([]);

    expect(mocks.findMany).not.toHaveBeenCalled();
    expect(mocks.updateMany).not.toHaveBeenCalled();
    expect(count).toBe(0);
  });
});
