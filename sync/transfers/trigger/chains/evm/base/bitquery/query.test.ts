import { describe, it, expect, vi } from 'vitest';

vi.mock('@trigger.dev/sdk/v3', () => ({
  logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { buildQuery, transformResponse } from './query';
import type {
  EvmBitQueryEventRow,
  SyncConfig,
  Facilitator,
  FacilitatorConfig,
} from '@/trigger/types';
import { QueryProvider, PaginationStrategy } from '@/trigger/types';
import { logger } from '@trigger.dev/sdk/v3';

const mockConfig: SyncConfig = {
  chain: 'base',
  provider: QueryProvider.BITQUERY,
  apiUrl: 'https://streaming.bitquery.io/graphql',
  paginationStrategy: PaginationStrategy.OFFSET,
  cron: '*/5 * * * *',
  maxDurationInSeconds: 900,
  facilitators: [],
  limit: 25_000,
  enabled: true,
  machine: 'medium-1x',
  buildQuery,
  transformResponse,
};

const mockFacilitator: Facilitator = {
  id: 'coinbase',
  addresses: {},
};

const mockFacilitatorConfig: FacilitatorConfig = {
  address: '0xFacilitatorAddress',
  token: {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    decimals: 6,
    symbol: 'USDC',
  },
  syncStartDate: new Date('2025-01-01'),
  enabled: true,
};

describe('buildQuery', () => {
  it('uses Events endpoint, not Transfers', () => {
    const query = buildQuery(
      mockConfig,
      mockFacilitatorConfig,
      new Date('2026-06-05T12:00:00Z'),
      new Date('2026-06-05T12:05:00Z')
    );

    expect(query).toContain('Events(');
    expect(query).not.toContain('Transfers(');
  });

  it('filters by Transfer signature hash', () => {
    const query = buildQuery(
      mockConfig,
      mockFacilitatorConfig,
      new Date('2026-06-05T12:00:00Z'),
      new Date('2026-06-05T12:05:00Z')
    );

    // Transfer(address,address,uint256) topic without 0x prefix
    expect(query).toContain(
      'ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
    );
  });

  it('filters by token address and facilitator', () => {
    const query = buildQuery(
      mockConfig,
      mockFacilitatorConfig,
      new Date('2026-06-05T12:00:00Z'),
      new Date('2026-06-05T12:05:00Z')
    );

    expect(query).toContain(mockFacilitatorConfig.token.address.toLowerCase());
    expect(query).toContain(mockFacilitatorConfig.address.toLowerCase());
  });

  it('orders by Log_EnterIndex for stable ordering', () => {
    const query = buildQuery(
      mockConfig,
      mockFacilitatorConfig,
      new Date('2026-06-05T12:00:00Z'),
      new Date('2026-06-05T12:05:00Z')
    );

    expect(query).toContain('Log_EnterIndex');
  });
});

describe('transformResponse', () => {
  function makeEvent(
    overrides: Partial<EvmBitQueryEventRow> = {}
  ): EvmBitQueryEventRow {
    return {
      Block: { Time: '2026-06-05T12:00:00Z', Number: '12345' },
      Transaction: {
        Hash: '0xabc123',
        From: '0xFacilitatorAddress',
        Index: 0,
      },
      LogHeader: {
        Address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        Index: 5,
        Removed: false,
      },
      Log: {
        EnterIndex: 206,
        Index: 31,
        LogAfterCallIndex: 0,
        SmartContract: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      },
      Arguments: [
        { Name: 'from', Value: { address: '0xSenderAddress' } },
        { Name: 'to', Value: { address: '0xRecipientAddress' } },
        { Name: 'value', Value: { bigInteger: '1000000' } },
      ],
      ...overrides,
    };
  }

  it('maps valid events to TransferEventData', () => {
    const data = { EVM: { Events: [makeEvent()] } };

    const result = transformResponse(
      data,
      mockConfig,
      mockFacilitator,
      mockFacilitatorConfig
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
      transaction_from: '0xfacilitatoraddress',
      sender: '0xsenderaddress',
      recipient: '0xrecipientaddress',
      amount: 1000000,
      block_timestamp: new Date('2026-06-05T12:00:00Z'),
      tx_hash: '0xabc123',
      log_index: 206, // Uses Log.EnterIndex, NOT Log.Index
      chain: 'base',
      provider: 'bitquery',
      decimals: 6,
      facilitator_id: 'coinbase',
    });
  });

  it('uses Log.EnterIndex as log_index (not Log.Index)', () => {
    const event = makeEvent({
      Log: {
        EnterIndex: 206, // BitQuery's stable index
        Index: 31, // Does NOT match CDP's receipt logIndex
        LogAfterCallIndex: 0,
        SmartContract: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      },
    });
    const data = { EVM: { Events: [event] } };

    const result = transformResponse(
      data,
      mockConfig,
      mockFacilitator,
      mockFacilitatorConfig
    );

    // log_index should be EnterIndex (206), not Index (31)
    expect(result[0]!.log_index).toBe(206);
  });

  it('skips events with missing from argument instead of throwing', () => {
    const event = makeEvent({
      Arguments: [
        { Name: 'to', Value: { address: '0xRecipient' } },
        { Name: 'value', Value: { bigInteger: '1000000' } },
      ],
    });
    const data = { EVM: { Events: [event] } };

    const result = transformResponse(
      data,
      mockConfig,
      mockFacilitator,
      mockFacilitatorConfig
    );

    expect(result).toHaveLength(0);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Skipping event with missing args')
    );
  });

  it('skips events with missing value argument instead of throwing', () => {
    const event = makeEvent({
      Arguments: [
        { Name: 'from', Value: { address: '0xSender' } },
        { Name: 'to', Value: { address: '0xRecipient' } },
      ],
    });
    const data = { EVM: { Events: [event] } };

    const result = transformResponse(
      data,
      mockConfig,
      mockFacilitator,
      mockFacilitatorConfig
    );

    expect(result).toHaveLength(0);
  });

  it('lowercases all addresses', () => {
    const data = { EVM: { Events: [makeEvent()] } };

    const result = transformResponse(
      data,
      mockConfig,
      mockFacilitator,
      mockFacilitatorConfig
    );

    expect(result[0]!.address).toBe(result[0]!.address.toLowerCase());
    expect(result[0]!.sender).toBe(result[0]!.sender.toLowerCase());
    expect(result[0]!.recipient).toBe(result[0]!.recipient.toLowerCase());
    expect(result[0]!.tx_hash).toBe(result[0]!.tx_hash.toLowerCase());
  });
});
