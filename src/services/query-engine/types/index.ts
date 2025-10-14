import type { z } from 'zod';

/**
 * Represents a single transfer event across any blockchain
 */
export interface TransferRow {
  address: string;           // Token contract address
  transaction_from: string;  // Address that submitted the transaction (facilitator)
  sender: string;           // Address sending tokens (buyer)
  recipient: string;        // Address receiving tokens (seller)
  amount: bigint;           // Amount of tokens transferred
  block_timestamp: Date;    // When the transfer occurred
  tx_hash: string;          // Transaction hash
  log_index: number;        // Index of the event in the block
  chain: string;            // Chain identifier (base, avalanche, etc)
}

/**
 * Common filters for querying transfers across chains
 */
export interface QueryFilters {
  addresses?: string[];      // Filter by recipient addresses (sellers)
  tokens?: string[];        // Filter by token contract addresses
  facilitators?: string[];  // Filter by facilitator addresses
  startDate?: Date;         // Start date for time range
  endDate?: Date;           // End date for time range
}

/**
 * Aggregate statistics result
 */
export interface QueryStatistics {
  total_transactions: number;
  total_amount: bigint;
  unique_buyers: number;
  unique_sellers: number;
  latest_block_timestamp: Date;
}

/**
 * Interface that all chain-specific query engines must implement
 */
export interface QueryEngine {
  /**
   * Execute a raw SQL query (or equivalent) on this chain
   * @param sql - Query string (format may vary by implementation)
   * @param schema - Zod schema to validate/parse results
   */
  executeQuery<T>(sql: string, schema: z.ZodSchema<T>): Promise<T | null>;

  /**
   * Get transfer events with filters
   * @param filters - Query filters
   */
  getTransfers(filters: QueryFilters): Promise<TransferRow[]>;

  /**
   * Get aggregate statistics
   * @param filters - Query filters
   */
  getStatistics(filters: QueryFilters): Promise<QueryStatistics>;

  /**
   * Check if this query engine is currently available
   * Useful for graceful degradation if an indexer is down
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get the chain identifier this engine handles
   */
  getChain(): string;

  /**
   * Get human-readable name for this chain
   */
  getChainName(): string;
}

/**
 * Result of a multi-chain query
 */
export interface MultiChainResult<T> {
  results: Map<string, T>;
  errors: Map<string, Error>;
  availableChains: string[];
  unavailableChains: string[];
}