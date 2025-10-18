/**
 * Example usage of the multi-chain query engine
 * 
 * This file demonstrates how to use the new abstraction layer
 * and can be used for testing during development
 */

import { queryRouter } from './router';
import { facilitators } from '@/lib/facilitators';
import { USDC_ADDRESS } from '@/lib/utils';

/**
 * Example 1: Query a single chain
 */
export async function getSingleChainStats() {
  const baseEngine = queryRouter.getEngine('base');
  
  const stats = await baseEngine.getStatistics({
    tokens: [USDC_ADDRESS],
    facilitators: facilitators.flatMap(f => f.addresses),
    startDate: new Date('2025-01-01'),
    endDate: new Date(),
  });
  
  console.log('Base chain stats:', stats);
  return stats;
}

/**
 * Example 2: Query multiple chains and aggregate
 */
export async function getMultiChainStats() {
  const chains = ['base', 'base_sepolia'];
  
  const result = await queryRouter.executeMultiChain(
    chains,
    async (engine) => {
      return engine.getStatistics({
        tokens: [USDC_ADDRESS],
        facilitators: facilitators.flatMap(f => f.addresses),
      });
    },
    {
      continueOnError: true,  // Don't fail if one chain is down
      timeout: 5000,           // 5 second timeout per chain
    }
  );

  // Aggregate results
  const totalTransactions = queryRouter.aggregateNumbers(
    new Map(
      Array.from(result.results.entries()).map(([chain, stats]) => [
        chain,
        stats.total_transactions,
      ])
    )
  );

  const totalAmount = queryRouter.aggregateBigInts(
    new Map(
      Array.from(result.results.entries()).map(([chain, stats]) => [
        chain,
        stats.total_amount,
      ])
    )
  );

  console.log('Multi-chain stats:', {
    chains: result.availableChains,
    totalTransactions,
    totalAmount: totalAmount.toString(),
    errors: Array.from(result.errors.entries()),
  });

  return {
    totalTransactions,
    totalAmount,
    perChain: result.results,
    availableChains: result.availableChains,
    unavailableChains: result.unavailableChains,
  };
}

/**
 * Example 3: Get transfers from multiple chains
 */
export async function getMultiChainTransfers() {
  const chains = ['base', 'base_sepolia'];
  
  const result = await queryRouter.executeMultiChain(
    chains,
    async (engine) => {
      return engine.getTransfers({
        tokens: [USDC_ADDRESS],
        facilitators: facilitators.flatMap(f => f.addresses),
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      });
    },
    { continueOnError: true }
  );

  // Combine all transfers and sort by timestamp
  const allTransfers = Array.from(result.results.values())
    .flat()
    .sort((a, b) => b.block_timestamp.getTime() - a.block_timestamp.getTime());

  console.log(`Found ${allTransfers.length} transfers across ${result.availableChains.length} chains`);
  
  return allTransfers;
}

/**
 * Example 4: Check chain health
 */
export async function checkChainHealth() {
  const availableChains = queryRouter.getAvailableChains();
  const healthyChains = await queryRouter.getHealthyChains();
  
  console.log('Available chains:', availableChains);
  console.log('Healthy chains:', healthyChains);
  
  const unhealthyChains = availableChains.filter(
    chain => !healthyChains.includes(chain)
  );
  
  if (unhealthyChains.length > 0) {
    console.warn('Unhealthy chains:', unhealthyChains);
  }
  
  return {
    available: availableChains,
    healthy: healthyChains,
    unhealthy: unhealthyChains,
  };
}

/**
 * Example 5: Query with error handling
 */
export async function getStatsWithErrorHandling() {
  const chains = ['base', 'base_sepolia'];
  
  try {
    const result = await queryRouter.executeMultiChain(
      chains,
      async (engine) => engine.getStatistics({}),
      { continueOnError: true }
    );

    // Check for errors
    if (result.errors.size > 0) {
      console.warn('Some chains failed:', result.errors);
    }

    // Use only successful results
    if (result.results.size === 0) {
      throw new Error('All chains failed');
    }

    return result;
  } catch (error) {
    console.error('Query failed:', error);
    throw error;
  }
}