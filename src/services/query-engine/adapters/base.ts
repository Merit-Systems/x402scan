import { z } from 'zod';
import type {
  QueryEngine,
  QueryFilters,
  QueryStatistics,
  TransferRow,
} from '../types';
import { runBaseSqlQuery } from '@/services/cdp/sql/query';
import { formatDateForSql } from '@/services/cdp/sql/lib';

/**
 * Query engine for Base blockchain using Coinbase CDP SQL API
 */
export class BaseAdapter implements QueryEngine {
  private readonly chain: string;
  private readonly chainName: string;
  private readonly tablePrefix: string;

  constructor(chain: 'base' | 'base_sepolia' = 'base') {
    this.chain = chain;
    this.chainName = chain === 'base' ? 'Base' : 'Base Sepolia';
    this.tablePrefix = chain === 'base' ? 'base' : 'base_sepolia';
  }

  async executeQuery<T>(sql: string, schema: z.ZodSchema<T>): Promise<T | null> {
    return runBaseSqlQuery(sql, schema);
  }

  async getTransfers(filters: QueryFilters): Promise<TransferRow[]> {
    const sql = this.buildTransferQuery(filters);
    
    const transferSchema = z.array(
      z.object({
        address: z.string(),
        transaction_from: z.string(),
        sender: z.string(),
        recipient: z.string(),
        amount: z.coerce.bigint(),
        block_timestamp: z.coerce.date(),
        tx_hash: z.string(),
        log_index: z.coerce.number(),
      })
    );

    const result = await this.executeQuery(sql, transferSchema);
    
    if (!result) {
      return [];
    }

    // Add chain identifier to each row
    return result.map(row => ({
      ...row,
      chain: this.chain,
    }));
  }

  async getStatistics(filters: QueryFilters): Promise<QueryStatistics> {
    const sql = this.buildStatisticsQuery(filters);
    
    const statsSchema = z.array(
      z.object({
        total_transactions: z.coerce.number(),
        total_amount: z.coerce.bigint(),
        unique_buyers: z.coerce.number(),
        unique_sellers: z.coerce.number(),
        latest_block_timestamp: z.coerce.date(),
      })
    );

    const result = await this.executeQuery(sql, statsSchema);
    
    if (!result || result.length === 0) {
      return {
        total_transactions: 0,
        total_amount: BigInt(0),
        unique_buyers: 0,
        unique_sellers: 0,
        latest_block_timestamp: new Date(),
      };
    }

    return result[0];
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Try a simple query to check if the API is responsive
      const sql = `SELECT COUNT(*) as count FROM ${this.tablePrefix}.events LIMIT 1`;
      const result = await this.executeQuery(sql, z.array(z.object({ count: z.number() })));
      return result !== null;
    } catch {
      return false;
    }
  }

  getChain(): string {
    return this.chain;
  }

  getChainName(): string {
    return this.chainName;
  }

  /**
   * Build SQL query for transfers with filters
   */
  private buildTransferQuery(filters: QueryFilters): string {
    const whereClauses: string[] = [
      `event_signature = 'Transfer(address,address,uint256)'`,
    ];

    // Filter by token addresses
    if (filters.tokens && filters.tokens.length > 0) {
      whereClauses.push(
        `address IN (${filters.tokens.map(t => `'${t}'`).join(', ')})`
      );
    }

    // Filter by facilitators
    if (filters.facilitators && filters.facilitators.length > 0) {
      whereClauses.push(
        `transaction_from IN (${filters.facilitators.map(f => `'${f}'`).join(', ')})`
      );
    }

    // Filter by recipient addresses (sellers)
    if (filters.addresses && filters.addresses.length > 0) {
      whereClauses.push(
        `parameters['to']::String IN (${filters.addresses.map(a => `'${a}'`).join(', ')})`
      );
    }

    // Date filters
    if (filters.startDate) {
      whereClauses.push(`block_timestamp >= '${formatDateForSql(filters.startDate)}'`);
    }
    if (filters.endDate) {
      whereClauses.push(`block_timestamp <= '${formatDateForSql(filters.endDate)}'`);
    }

    return `
      SELECT
        address,
        transaction_from,
        parameters['from']::String AS sender,
        parameters['to']::String AS recipient,
        parameters['value']::UInt256 AS amount,
        block_timestamp,
        transaction_hash AS tx_hash,
        log_index
      FROM ${this.tablePrefix}.events
      WHERE ${whereClauses.join('\n        AND ')}
      ORDER BY block_timestamp DESC
      LIMIT 1000
    `;
  }

  /**
   * Build SQL query for aggregate statistics
   */
  private buildStatisticsQuery(filters: QueryFilters): string {
    const whereClauses: string[] = [
      `event_signature = 'Transfer(address,address,uint256)'`,
      `parameters['value']::UInt256 < 1000000000`, // Filter out abnormally large transfers
    ];

    // Filter by token addresses
    if (filters.tokens && filters.tokens.length > 0) {
      whereClauses.push(
        `address IN (${filters.tokens.map(t => `'${t}'`).join(', ')})`
      );
    }

    // Filter by facilitators
    if (filters.facilitators && filters.facilitators.length > 0) {
      whereClauses.push(
        `transaction_from IN (${filters.facilitators.map(f => `'${f}'`).join(', ')})`
      );
    }

    // Filter by recipient addresses
    if (filters.addresses && filters.addresses.length > 0) {
      whereClauses.push(
        `parameters['to']::String IN (${filters.addresses.map(a => `'${a}'`).join(', ')})`
      );
    }

    // Date filters
    if (filters.startDate) {
      whereClauses.push(`block_timestamp >= '${formatDateForSql(filters.startDate)}'`);
    }
    if (filters.endDate) {
      whereClauses.push(`block_timestamp <= '${formatDateForSql(filters.endDate)}'`);
    }

    return `
      SELECT
        COUNT(*) AS total_transactions,
        SUM(parameters['value']::UInt256) AS total_amount,
        COUNT(DISTINCT parameters['from']::String) AS unique_buyers,
        COUNT(DISTINCT parameters['to']::String) AS unique_sellers,
        MAX(block_timestamp) AS latest_block_timestamp
      FROM ${this.tablePrefix}.events
      WHERE ${whereClauses.join('\n        AND ')}
    `;
  }
}