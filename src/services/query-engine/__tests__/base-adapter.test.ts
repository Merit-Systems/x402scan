import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { BaseAdapter } from '../adapters/base';
import { USDC_ADDRESS } from '@/lib/utils';
import { facilitators } from '@/lib/facilitators';

// Mock the runBaseSqlQuery function
vi.mock('@/services/cdp/sql/query', () => ({
  runBaseSqlQuery: vi.fn(),
}));

import { runBaseSqlQuery } from '@/services/cdp/sql/query';

describe('BaseAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with base chain', () => {
      const adapter = new BaseAdapter('base');
      expect(adapter.getChain()).toBe('base');
      expect(adapter.getChainName()).toBe('Base');
    });

    it('should initialize with base_sepolia chain', () => {
      const adapter = new BaseAdapter('base_sepolia');
      expect(adapter.getChain()).toBe('base_sepolia');
      expect(adapter.getChainName()).toBe('Base Sepolia');
    });

    it('should default to base chain', () => {
      const adapter = new BaseAdapter();
      expect(adapter.getChain()).toBe('base');
    });
  });

  describe('getStatistics', () => {
    it('should return statistics with filters', async () => {
      const adapter = new BaseAdapter('base');
      
      const mockStats = [{
        total_transactions: 100,
        total_amount: BigInt(1000000),
        unique_buyers: 50,
        unique_sellers: 25,
        latest_block_timestamp: new Date('2025-01-15'),
      }];

      vi.mocked(runBaseSqlQuery).mockResolvedValueOnce(mockStats);

      const result = await adapter.getStatistics({
        tokens: [USDC_ADDRESS],
        facilitators: facilitators.flatMap(f => f.addresses),
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
      });

      expect(result.total_transactions).toBe(100);
      expect(result.total_amount).toBe(BigInt(1000000));
      expect(result.unique_buyers).toBe(50);
      expect(result.unique_sellers).toBe(25);
      expect(runBaseSqlQuery).toHaveBeenCalled();
    });

    it('should return zero statistics when no data', async () => {
      const adapter = new BaseAdapter('base');
      
      vi.mocked(runBaseSqlQuery).mockResolvedValueOnce(null);

      const result = await adapter.getStatistics({});

      expect(result.total_transactions).toBe(0);
      expect(result.total_amount).toBe(BigInt(0));
      expect(result.unique_buyers).toBe(0);
      expect(result.unique_sellers).toBe(0);
    });

    it('should build correct SQL query with filters', async () => {
      const adapter = new BaseAdapter('base');
      
      vi.mocked(runBaseSqlQuery).mockClear();
      vi.mocked(runBaseSqlQuery).mockResolvedValueOnce([{
        total_transactions: 0,
        total_amount: BigInt(0),
        unique_buyers: 0,
        unique_sellers: 0,
        latest_block_timestamp: new Date(),
      }]);

      await adapter.getStatistics({
        tokens: [USDC_ADDRESS],
        facilitators: facilitators.flatMap(f => f.addresses),
        addresses: ['0xdef'],
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
      });

      const sqlCall = vi.mocked(runBaseSqlQuery).mock.calls[0][0];
      
      // Verify SQL contains filters (addresses filter goes in WHERE clause)
      expect(sqlCall).toContain('FROM base.events');
      expect(sqlCall).toContain(USDC_ADDRESS);
      expect(sqlCall).toContain("parameters['to']::String IN ('0xdef')");
      expect(sqlCall).toContain('2025-01-01');
    });
  });

  describe('getTransfers', () => {
    it('should return transfers with chain identifier', async () => {
      const adapter = new BaseAdapter('base');
      
      const mockTransfers = [{
        address: USDC_ADDRESS,
        transaction_from: '0xfacilitator',
        sender: '0xbuyer',
        recipient: '0xseller',
        amount: BigInt(1000000),
        block_timestamp: new Date('2025-01-15'),
        tx_hash: '0xhash123',
        log_index: 0,
      }];

      vi.mocked(runBaseSqlQuery).mockResolvedValueOnce(mockTransfers);

      const result = await adapter.getTransfers({
        tokens: [USDC_ADDRESS],
      });

      expect(result).toHaveLength(1);
      expect(result[0].chain).toBe('base');
      expect(result[0].address).toBe(USDC_ADDRESS);
      expect(result[0].amount).toBe(BigInt(1000000));
    });

    it('should return empty array when no transfers', async () => {
      const adapter = new BaseAdapter('base');
      
      vi.mocked(runBaseSqlQuery).mockResolvedValueOnce(null);

      const result = await adapter.getTransfers({});

      expect(result).toEqual([]);
    });

    it('should use correct table prefix for base_sepolia', async () => {
      const adapter = new BaseAdapter('base_sepolia');
      
      vi.mocked(runBaseSqlQuery).mockResolvedValueOnce([]);

      await adapter.getTransfers({});

      const sqlCall = vi.mocked(runBaseSqlQuery).mock.calls[0][0];
      expect(sqlCall).toContain('FROM base_sepolia.events');
    });
  });

  describe('isAvailable', () => {
    it('should return true when query succeeds', async () => {
      const adapter = new BaseAdapter('base');
      
      vi.mocked(runBaseSqlQuery).mockResolvedValueOnce([{ count: 100 }]);

      const result = await adapter.isAvailable();

      expect(result).toBe(true);
    });

    it('should return false when query fails', async () => {
      const adapter = new BaseAdapter('base');
      
      vi.mocked(runBaseSqlQuery).mockRejectedValueOnce(new Error('API down'));

      const result = await adapter.isAvailable();

      expect(result).toBe(false);
    });

    it('should return false when query returns null', async () => {
      const adapter = new BaseAdapter('base');
      
      vi.mocked(runBaseSqlQuery).mockResolvedValueOnce(null);

      const result = await adapter.isAvailable();

      expect(result).toBe(false);
    });
  });

  describe('executeQuery', () => {
    it('should pass through to runBaseSqlQuery', async () => {
      const adapter = new BaseAdapter('base');
      const mockResult = [{ test: 'data' }];
      const mockSchema = z.array(z.object({ test: z.string() }));
      
      vi.mocked(runBaseSqlQuery).mockResolvedValueOnce(mockResult);

      const result = await adapter.executeQuery('SELECT * FROM test', mockSchema);

      expect(result).toEqual(mockResult);
      expect(runBaseSqlQuery).toHaveBeenCalledWith('SELECT * FROM test', mockSchema);
    });
  });
});