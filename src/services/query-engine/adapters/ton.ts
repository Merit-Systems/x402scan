import { z } from 'zod';
import type {
  QueryEngine,
  QueryFilters,
  QueryStatistics,
  TransferRow,
} from '../types';

/**
 * TON API Response Types
 */
const tonJettonTransferSchema = z.object({
  lt: z.string(), // Logical time (used as log_index)
  utime: z.number(), // Unix timestamp
  transaction_hash: z.string(),
  source: z.object({
    address: z.string(),
  }),
  destination: z.object({
    address: z.string(),
  }),
  amount: z.string(), // Amount in nano tokens
  jetton: z.object({
    address: z.string(), // Jetton master contract address
    name: z.string().optional(),
    symbol: z.string().optional(),
    decimals: z.number().optional(),
  }),
  comment: z.string().optional(),
});

const tonApiResponseSchema = z.object({
  events: z.array(tonJettonTransferSchema),
});

/**
 * Query engine for TON blockchain using TONAPI
 * Docs: https://docs.tonconsole.com/tonapi/api-v2
 */
export class TonAdapter implements QueryEngine {
  private readonly chain: string;
  private readonly chainName: string;
  private readonly apiBaseUrl: string;
  private readonly apiKey?: string;

  constructor(chain: 'ton' | 'ton_testnet' = 'ton', apiKey?: string) {
    this.chain = chain;
    this.chainName = chain === 'ton' ? 'TON' : 'TON Testnet';
    
    // TON Mainnet vs Testnet
    this.apiBaseUrl = chain === 'ton' 
      ? 'https://tonapi.io/v2'
      : 'https://testnet.tonapi.io/v2';
    
    this.apiKey = apiKey || process.env.TONAPI_KEY;
  }

  async executeQuery<T>(sql: string, schema: z.ZodSchema<T>): Promise<T | null> {
    // TON doesn't support SQL queries - this is for compatibility
    throw new Error('TON adapter does not support raw SQL queries. Use getTransfers() or getStatistics() instead.');
  }

  async getTransfers(filters: QueryFilters): Promise<TransferRow[]> {
    try {
      const transfers: TransferRow[] = [];
      
      // If specific addresses (sellers) are provided, query each
      const addresses = filters.addresses || [];
      
      if (addresses.length === 0) {
        // Without specific addresses, we can't efficiently query TON
        // Would need to query all accounts which is not practical
        console.warn('[TonAdapter] No addresses specified - cannot query all TON transfers');
        return [];
      }

      // Query transfers for each address
      for (const address of addresses) {
        const accountTransfers = await this.getAccountTransfers(address, filters);
        transfers.push(...accountTransfers);
      }

      // Sort by timestamp descending
      return transfers.sort((a, b) => 
        b.block_timestamp.getTime() - a.block_timestamp.getTime()
      );
    } catch (error) {
      console.error('[TonAdapter] Error fetching transfers:', error);
      return [];
    }
  }

  async getStatistics(filters: QueryFilters): Promise<QueryStatistics> {
    try {
      // Get all transfers first
      const transfers = await this.getTransfers(filters);

      if (transfers.length === 0) {
        return {
          total_transactions: 0,
          total_amount: BigInt(0),
          unique_buyers: 0,
          unique_sellers: 0,
          latest_block_timestamp: new Date(),
        };
      }

      // Calculate statistics
      const totalAmount = transfers.reduce(
        (sum, t) => sum + t.amount,
        BigInt(0)
      );

      const uniqueBuyers = new Set(transfers.map(t => t.sender)).size;
      const uniqueSellers = new Set(transfers.map(t => t.recipient)).size;
      const latestTimestamp = transfers[0].block_timestamp; // Already sorted desc

      return {
        total_transactions: transfers.length,
        total_amount: totalAmount,
        unique_buyers: uniqueBuyers,
        unique_sellers: uniqueSellers,
        latest_block_timestamp: latestTimestamp,
      };
    } catch (error) {
      console.error('[TonAdapter] Error calculating statistics:', error);
      return {
        total_transactions: 0,
        total_amount: BigInt(0),
        unique_buyers: 0,
        unique_sellers: 0,
        latest_block_timestamp: new Date(),
      };
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/status`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return response.ok;
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
   * Get jetton transfers for a specific account
   */
  private async getAccountTransfers(
    address: string,
    filters: QueryFilters
  ): Promise<TransferRow[]> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      // Pagination
      params.append('limit', '100');
      
      // Date filters
      if (filters.startDate) {
        params.append('start_date', Math.floor(filters.startDate.getTime() / 1000).toString());
      }
      if (filters.endDate) {
        params.append('end_date', Math.floor(filters.endDate.getTime() / 1000).toString());
      }

      // Query TONAPI for jetton transfers
      const url = `${this.apiBaseUrl}/accounts/${address}/jettons/history?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`TONAPI responded with ${response.status}`);
      }

      const data = await response.json();
      const parsed = tonApiResponseSchema.parse(data);

      // Convert TON transfers to our standard format
      return parsed.events.map(event => this.convertToTransferRow(event, address));
    } catch (error) {
      console.error('[TonAdapter] Error fetching account transfers:', error);
      return [];
    }
  }

  /**
   * Convert TONAPI jetton transfer to our TransferRow format
   */
  private convertToTransferRow(
    transfer: z.infer<typeof tonJettonTransferSchema>,
    _queryAddress: string
  ): TransferRow {
    return {
      address: transfer.jetton.address, // Jetton master contract
      transaction_from: transfer.source.address, // Who initiated the transaction
      sender: transfer.source.address, // Token sender (buyer in x402 context)
      recipient: transfer.destination.address, // Token recipient (seller in x402 context)
      amount: BigInt(transfer.amount), // Amount in nano tokens
      block_timestamp: new Date(transfer.utime * 1000), // Convert unix timestamp to Date
      tx_hash: transfer.transaction_hash,
      log_index: parseInt(transfer.lt), // Use logical time as index
      chain: this.chain,
    };
  }

  /**
   * Get headers for TONAPI requests
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  /**
   * Helper: Convert TON address formats if needed
   * TON has multiple address formats (raw, user-friendly bounceable/non-bounceable)
   */
  static normalizeAddress(address: string): string {
    // TONAPI handles this internally, but you might need this for validation
    return address.trim();
  }

  /**
   * Helper: Convert jetton amount to human-readable format
   */
  static formatJettonAmount(amount: bigint, decimals: number = 9): string {
    const divisor = BigInt(10 ** decimals);
    const integerPart = amount / divisor;
    const fractionalPart = amount % divisor;
    
    if (fractionalPart === BigInt(0)) {
      return integerPart.toString();
    }
    
    const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
    return `${integerPart}.${fractionalStr}`;
  }
}