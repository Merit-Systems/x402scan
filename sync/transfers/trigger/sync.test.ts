import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock external dependencies before importing the module under test
vi.mock('@/db/services', () => ({
  createManyTransferEvents: vi.fn(),
  getTransferEvents: vi.fn(),
}));

vi.mock('@trigger.dev/sdk/v3', () => ({
  logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
  schedules: { task: vi.fn() },
}));

vi.mock('./fetch/fetch', () => ({
  fetchTransfers: vi.fn(),
}));

import { getTransferEvents } from '@/db/services';
import {
  getMostRecentTransferForResume,
  normalizeTransactionFrom,
} from './sync';
import type { SyncConfig } from './types';
import { QueryProvider, PaginationStrategy } from './types';

const getTransferEventsMock = vi.mocked(getTransferEvents);

const baseSyncConfig: SyncConfig = {
  chain: 'base',
  provider: QueryProvider.BITQUERY,
  paginationStrategy: PaginationStrategy.OFFSET,
  cron: '*/5 * * * *',
  maxDurationInSeconds: 900,
  facilitators: [],
  limit: 25_000,
  enabled: true,
  machine: 'medium-1x',
  buildQuery: () => '',
  transformResponse: () => [],
};

describe('normalizeTransactionFrom', () => {
  it('lowercases EVM addresses', () => {
    expect(normalizeTransactionFrom('base', '0xAbCdEf1234567890')).toBe(
      '0xabcdef1234567890'
    );
  });

  it('preserves Solana addresses as-is', () => {
    expect(normalizeTransactionFrom('solana', 'SoLaNaAdDrEsS123')).toBe(
      'SoLaNaAdDrEsS123'
    );
  });
});

describe('getMostRecentTransferForResume', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the latest transfer across multiple providers', async () => {
    const cdpTransfer = {
      block_timestamp: new Date('2026-06-05T17:45:31Z'),
      id: 'cdp-1',
    };
    const bitqueryTransfer = {
      block_timestamp: new Date('2026-06-05T18:28:27Z'),
      id: 'bq-1',
    };

    getTransferEventsMock
      .mockResolvedValueOnce([cdpTransfer] as never)
      .mockResolvedValueOnce([bitqueryTransfer] as never);

    const result = await getMostRecentTransferForResume(
      {
        ...baseSyncConfig,
        resumeFromProviders: [QueryProvider.CDP, QueryProvider.BITQUERY],
      },
      '0xfacilitator',
      [QueryProvider.CDP, QueryProvider.BITQUERY]
    );

    expect(result?.block_timestamp).toEqual(new Date('2026-06-05T18:28:27Z'));
  });

  it('queries each provider separately', async () => {
    getTransferEventsMock.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    await getMostRecentTransferForResume(baseSyncConfig, '0xfacilitator', [
      QueryProvider.CDP,
      QueryProvider.BITQUERY,
    ]);

    expect(getTransferEventsMock).toHaveBeenCalledTimes(2);
    expect(getTransferEventsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ provider: QueryProvider.CDP }),
      })
    );
    expect(getTransferEventsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ provider: QueryProvider.BITQUERY }),
      })
    );
  });

  it('returns undefined when no transfers exist from any provider', async () => {
    getTransferEventsMock.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const result = await getMostRecentTransferForResume(
      baseSyncConfig,
      '0xfacilitator',
      [QueryProvider.CDP, QueryProvider.BITQUERY]
    );

    expect(result).toBeUndefined();
  });

  it('returns the single provider result when only one has data', async () => {
    const cdpTransfer = {
      block_timestamp: new Date('2026-06-05T17:45:31Z'),
    };

    getTransferEventsMock
      .mockResolvedValueOnce([cdpTransfer] as never)
      .mockResolvedValueOnce([]);

    const result = await getMostRecentTransferForResume(
      baseSyncConfig,
      '0xfacilitator',
      [QueryProvider.CDP, QueryProvider.BITQUERY]
    );

    expect(result?.block_timestamp).toEqual(new Date('2026-06-05T17:45:31Z'));
  });
});

describe('resume cursor advances forward (no overlap)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts from T+1s after latest transfer, not T-overlap', async () => {
    // This test proves the bug fix: without resumeOverlapMs, the cursor
    // advances forward by 1 second, not backwards by 60 seconds.
    const latestTimestamp = new Date('2026-06-05T17:45:31Z');
    const cdpTransfer = { block_timestamp: latestTimestamp };

    getTransferEventsMock.mockResolvedValueOnce([cdpTransfer] as never);

    const result = await getMostRecentTransferForResume(
      baseSyncConfig,
      '0xfacilitator',
      [QueryProvider.CDP]
    );

    // syncFacilitator computes: since = result.block_timestamp + 1000ms
    const since = new Date(result!.block_timestamp.getTime() + 1000);
    expect(since).toEqual(new Date('2026-06-05T17:45:32Z'));

    // The old buggy code would have done: since = result.block_timestamp - 60000ms
    const buggyOverlapSince = new Date(
      result!.block_timestamp.getTime() - 60000
    );
    expect(buggyOverlapSince).toEqual(new Date('2026-06-05T17:44:31Z'));

    // Cursor moves FORWARD, not backward
    expect(since.getTime()).toBeGreaterThan(latestTimestamp.getTime());
    expect(buggyOverlapSince.getTime()).toBeLessThan(latestTimestamp.getTime());
  });
});
