/**
 * Example usage of TON blockchain integration with x402scan
 * Perfect for Telegram Mini Apps!
 */

import { TonAdapter } from './adapters/ton';
import { queryRouter } from './router';

/**
 * Example 1: Get TON jetton transfers for a wallet
 */
export async function getTonWalletTransfers(walletAddress: string) {
  const tonAdapter = new TonAdapter('ton');
  
  const transfers = await tonAdapter.getTransfers({
    addresses: [walletAddress], // The wallet you want to track
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
  });
  
  console.log(`Found ${transfers.length} TON transfers for ${walletAddress}`);
  
  // Format for display in Telegram Mini App
  return transfers.map(t => ({
    amount: TonAdapter.formatJettonAmount(t.amount),
    from: t.sender,
    to: t.recipient,
    token: t.address,
    timestamp: t.block_timestamp.toISOString(),
    txHash: t.tx_hash,
  }));
}

/**
 * Example 2: Get statistics for a TON merchant/seller
 */
export async function getTonMerchantStats(merchantAddress: string) {
  const tonAdapter = new TonAdapter('ton');
  
  const stats = await tonAdapter.getStatistics({
    addresses: [merchantAddress],
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
  });
  
  return {
    totalSales: stats.total_transactions,
    totalRevenue: TonAdapter.formatJettonAmount(stats.total_amount),
    uniqueCustomers: stats.unique_buyers,
    lastSale: stats.latest_block_timestamp,
  };
}

/**
 * Example 3: Multi-chain query - Compare TON with Base
 * Perfect for showing users their activity across chains!
 */
export async function getMultiChainActivity(userAddresses: {
  ton: string;
  base: string;
}) {
  const result = await queryRouter.executeMultiChain(
    ['ton', 'base'],
    async (engine) => {
      const address = engine.getChain() === 'ton' 
        ? userAddresses.ton 
        : userAddresses.base;
      
      return engine.getStatistics({
        addresses: [address],
      });
    },
    { continueOnError: true }
  );

  // Aggregate across chains
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

  return {
    totalTransactions,
    totalAmount: totalAmount.toString(),
    byChain: Object.fromEntries(result.results),
    availableChains: result.availableChains,
  };
}

/**
 * Example 4: Real-time monitoring for Telegram Mini App
 * Poll for new transactions
 */
export async function monitorTonWallet(
  walletAddress: string,
  onNewTransfer: (transfer: any) => void
) {
  const tonAdapter = new TonAdapter('ton');
  let lastCheckedTime = new Date();

  // Poll every 10 seconds
  const interval = setInterval(async () => {
    try {
      const transfers = await tonAdapter.getTransfers({
        addresses: [walletAddress],
        startDate: lastCheckedTime,
      });

      // Process new transfers
      if (transfers.length > 0) {
        transfers.forEach(onNewTransfer);
        lastCheckedTime = new Date();
      }
    } catch (error) {
      console.error('Error monitoring wallet:', error);
    }
  }, 10000);

  // Return cleanup function
  return () => clearInterval(interval);
}

/**
 * Example 5: For Telegram Mini App - Payment verification
 * Verify that a user paid for x402 resource
 */
export async function verifyTonPayment(
  merchantAddress: string,
  expectedAmount: bigint,
  timeWindow: number = 5 * 60 * 1000 // 5 minutes
): Promise<boolean> {
  const tonAdapter = new TonAdapter('ton');
  
  const transfers = await tonAdapter.getTransfers({
    addresses: [merchantAddress],
    startDate: new Date(Date.now() - timeWindow),
  });

  // Check if any transfer matches expected amount
  return transfers.some(t => 
    t.amount >= expectedAmount &&
    t.recipient === merchantAddress
  );
}

/**
 * Example 6: Get jetton transfers by token contract
 * Useful for tracking specific token payments
 */
export async function getTokenTransfers(
  walletAddress: string,
  tokenContract: string
) {
  const tonAdapter = new TonAdapter('ton');
  
  const allTransfers = await tonAdapter.getTransfers({
    addresses: [walletAddress],
  });

  // Filter by token contract
  return allTransfers.filter(t => t.address === tokenContract);
}