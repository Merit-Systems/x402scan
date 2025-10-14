import type { QueryEngine, MultiChainResult } from './types';
import { BaseAdapter } from './adapters/base';

/**
 * Routes queries to appropriate chain-specific query engines
 */
export class QueryRouter {
  private adapters: Map<string, QueryEngine>;

  constructor() {
    this.adapters = new Map();
    this.initializeAdapters();
  }

  /**
   * Initialize all available adapters
   */
  private initializeAdapters() {
    // Base chain adapters
    this.adapters.set('base', new BaseAdapter('base'));
    this.adapters.set('base_sepolia', new BaseAdapter('base_sepolia'));

    // TODO: Add other chain adapters as they're implemented
    // this.adapters.set('avalanche', new AvalancheAdapter());
    // this.adapters.set('solana', new SolanaAdapter());
    // etc.
  }

  /**
   * Get query engine for a specific chain
   */
  getEngine(chain: string): QueryEngine {
    const engine = this.adapters.get(chain);
    if (!engine) {
      throw new Error(`No query engine available for chain: ${chain}`);
    }
    return engine;
  }

  /**
   * Get all available chain identifiers
   */
  getAvailableChains(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Check which chains are currently available
   */
  async getHealthyChains(): Promise<string[]> {
    const checks = await Promise.all(
      Array.from(this.adapters.entries()).map(async ([chain, engine]) => {
        try {
          const available = await engine.isAvailable();
          return available ? chain : null;
        } catch {
          return null;
        }
      })
    );

    return checks.filter((chain): chain is string => chain !== null);
  }

  /**
   * Execute a query function across multiple chains in parallel
   * Returns both successful results and any errors encountered
   */
  async executeMultiChain<T>(
    chains: string[],
    queryFn: (engine: QueryEngine) => Promise<T>,
    options?: {
      continueOnError?: boolean;  // If true, continues even if some chains fail
      timeout?: number;            // Timeout in milliseconds per chain
    }
  ): Promise<MultiChainResult<T>> {
    const results = new Map<string, T>();
    const errors = new Map<string, Error>();
    const availableChains: string[] = [];
    const unavailableChains: string[] = [];

    const promises = chains.map(async (chain) => {
      try {
        const engine = this.getEngine(chain);
        
        // Check if chain is available first
        const isAvailable = await engine.isAvailable();
        if (!isAvailable) {
          unavailableChains.push(chain);
          throw new Error(`Chain ${chain} is currently unavailable`);
        }

        availableChains.push(chain);

        // Execute the query with optional timeout
        let result: T;
        if (options?.timeout) {
          result = await this.withTimeout(queryFn(engine), options.timeout);
        } else {
          result = await queryFn(engine);
        }

        results.set(chain, result);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        errors.set(chain, err);
        
        if (!options?.continueOnError) {
          throw err;
        }
      }
    });

    // Wait for all queries to complete (or fail)
    await Promise.allSettled(promises);

    return {
      results,
      errors,
      availableChains,
      unavailableChains,
    };
  }

  /**
   * Execute query with timeout
   */
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
      ),
    ]);
  }

  /**
   * Aggregate numeric results across chains
   */
  aggregateNumbers(results: Map<string, number>): number {
    return Array.from(results.values()).reduce((sum, val) => sum + val, 0);
  }

  /**
   * Aggregate BigInt results across chains
   */
  aggregateBigInts(results: Map<string, bigint>): bigint {
    return Array.from(results.values()).reduce((sum, val) => sum + val, BigInt(0));
  }

  /**
   * Get the most recent timestamp across chains
   */
  getLatestTimestamp(results: Map<string, Date>): Date {
    const timestamps = Array.from(results.values());
    if (timestamps.length === 0) return new Date();
    
    return new Date(Math.max(...timestamps.map(d => d.getTime())));
  }
}

// Export singleton instance
export const queryRouter = new QueryRouter();