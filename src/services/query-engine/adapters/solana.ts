import { z } from 'zod';
import type {
  QueryEngine,
  QueryFilters,
  QueryStatistics,
  TransferRow,
} from '../types';

/**
 * Helius API Response Types for Solana
 */
const heliusTokenTransferSchema = z.object({
  signature: z.string(), // Transaction signature (hash)
  slot: z.number(), // Slot number (like block number)
  timestamp: z.number(), // Unix timestamp
  tokenTransfers: z.array(
    z.object({
      fromUserAccount: z.string(), // Sender address
      toUserAccount: z.string(), // Recipient address
      fromTokenAccount: z.string().optional(),
      toTokenAccount: z.string().optional(),
      tokenAmount: z.number(), // Amount with decimals already applied
      mint: z.string(), // Token mint address (like contract address)
      tokenStandard: z.string().optional(), // "Fungible", "NonFungible", etc
    })
  ),
  fee: z.number().optional(),
  feePayer: z.string().optional(),
});

const heliusResponseSchema = z.array(heliusTokenTransferSchema);

/**
 * Query engine for Solana blockchain using Helius API
 * Docs: https://docs.helius.dev/
 */
export class SolanaAdapter implements QueryEngine {
  private readonly chain: string;
  private readonly chainName: string;
  private readonly apiBaseUrl: string;
  private readonly apiKey?: string;

  constructor(chain: 'solana' | 'solana_devnet' = 'solana', apiKey?: string) {
    this.chain = chain;
    this.chainName = chain === 'solana' ? 'Solana' : 'Solana Devnet';
    
    // Helius supports both mainnet and devnet
    const network = chain === 'solana' ? 'mainnet-beta' : 'devnet';
    this.apiKey = apiKey || process.env.HELIUS_API_KEY;
    
    if (!this.apiKey) {
      console.warn('[SolanaAdapter] No HELIUS_API_KEY found. Adapter will not work.');
    }
    
    this.apiBaseUrl = `https://api.helius.xyz/v0`;
    // Helius RPC endpoint includes API key in URL
    this.rpcUrl = `https://${network}.helius-rpc.com/?api-key=${this.apiKey}`;
  }

  private rpcUrl: string;

  async executeQuery<T>(sql: string, schema: z.ZodSchema<T>): Promise<T | null> {
    // Solana doesn't support SQL queries - this is for compatibility
    throw new Error('Solana adapter does not support raw SQL queries. Use getTransfers() or getStatistics() instead.');
  }

  async getTransfers(filters: QueryFilters): Promise<TransferRow[]> {
    try {
      const transfers: TransferRow[] = [];
      
      // If specific addresses (sellers) are provided, query each
      const addresses = filters.addresses || [];
      
      if (addresses.length === 0) {
        console.warn('[SolanaAdapter] No addresses specified - cannot query all Solana transfers');
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
      console.error('[SolanaAdapter] Error fetching transfers:', error);
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
      console.error('[SolanaAdapter] Error calculating statistics:', error);
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
      // Check Helius API health
      const response = await fetch(`${this.apiBaseUrl}/health`, {
        method: 'GET',
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
   * Get SPL token transfers for a specific account using Helius
   */
  private async getAccountTransfers(
    address: string,
    filters: QueryFilters
  ): Promise<TransferRow[]> {
    try {
      if (!this.apiKey) {
        throw new Error('HELIUS_API_KEY is required');
      }

      // Build query URL
      // Helius provides parsed transaction history with token transfers
      const url = `${this.apiBaseUrl}/addresses/${address}/transactions?api-key=${this.apiKey}`;
      
      const params: Record<string, any> = {
        type: 'TRANSFER', // Only get transfer transactions
      };

      // Apply filters
      if (filters.startDate) {
        params.before = filters.startDate.toISOString();
      }
      if (filters.endDate) {
        params.after = filters.endDate.toISOString();
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Helius API responded with ${response.status}`);
      }

      const data = await response.json();
      const parsed = heliusResponseSchema.parse(data);

      // Convert Solana transfers to our standard format
      const transfers: TransferRow[] = [];
      
      for (const tx of parsed) {
        // Each transaction can have multiple token transfers
        for (const transfer of tx.tokenTransfers) {
          // Filter by token mints if specified
          if (filters.tokens && filters.tokens.length > 0) {
            if (!filters.tokens.includes(transfer.mint)) {
              continue;
            }
          }

          transfers.push(this.convertToTransferRow(tx, transfer));
        }
      }

      return transfers;
    } catch (error) {
      console.error('[SolanaAdapter] Error fetching account transfers:', error);
      return [];
    }
  }

  /**
   * Convert Helius transfer to our TransferRow format
   */
  private convertToTransferRow(
    transaction: z.infer<typeof heliusTokenTransferSchema>,
    transfer: z.infer<typeof heliusTokenTransferSchema>['tokenTransfers'][0]
  ): TransferRow {
    // Convert amount to smallest unit (like lamports)
    // Helius returns amount with decimals applied, we need to store as smallest unit
    const amount = BigInt(Math.floor(transfer.tokenAmount * 1e9)); // Assume 9 decimals for most SPL tokens

    return {
      address: transfer.mint, // Token mint address
      transaction_from: transaction.feePayer || transfer.fromUserAccount, // Who paid for tx
      sender: transfer.fromUserAccount, // Token sender (buyer)
      recipient: transfer.toUserAccount, // Token recipient (seller)
      amount: amount,
      block_timestamp: new Date(transaction.timestamp * 1000),
      tx_hash: transaction.signature,
      log_index: transaction.slot, // Use slot as log index
      chain: this.chain,
    };
  }

  /**
   * Get token metadata from Helius
   */
  async getTokenMetadata(mintAddress: string): Promise<{
    name: string;
    symbol: string;
    decimals: number;
  } | null> {
    try {
      if (!this.apiKey) {
        throw new Error('HELIUS_API_KEY is required');
      }

      const response = await fetch(
        `${this.apiBaseUrl}/token-metadata?api-key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mintAccounts: [mintAddress],
          }),
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data.length === 0) {
        return null;
      }

      const token = data[0];
      return {
        name: token.onChainMetadata?.metadata?.data?.name || 'Unknown',
        symbol: token.onChainMetadata?.metadata?.data?.symbol || 'Unknown',
        decimals: token.onChainMetadata?.metadata?.decimals || 9,
      };
    } catch (error) {
      console.error('[SolanaAdapter] Error fetching token metadata:', error);
      return null;
    }
  }

  /**
   * Helper: Format SPL token amount
   */
  static formatTokenAmount(amount: bigint, decimals: number = 9): string {
    const divisor = BigInt(10 ** decimals);
    const integerPart = amount / divisor;
    const fractionalPart = amount % divisor;
    
    if (fractionalPart === BigInt(0)) {
      return integerPart.toString();
    }
    
    const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
    return `${integerPart}.${fractionalStr}`;
  }

  /**
   * Helper: Convert lamports to SOL
   */
  static lamportsToSol(lamports: bigint): string {
    return SolanaAdapter.formatTokenAmount(lamports, 9);
  }

  /**
   * Helper: Validate Solana address format
   */
  static isValidAddress(address: string): boolean {
    // Solana addresses are base58 encoded and typically 32-44 characters
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return base58Regex.test(address);
  }
}