/**
 * Example usage of Solana blockchain integration with x402scan
 * Using Helius API for optimal performance
 */

import { SolanaAdapter } from './adapters/solana';
import { queryRouter } from './router';

/**
 * Example 1: Get SPL token transfers for a Solana wallet
 */
export async function getSolanaWalletTransfers(walletAddress: string) {
  const solana = new SolanaAdapter('solana');
  
  // Validate address format first
  if (!SolanaAdapter.isValidAddress(walletAddress)) {
    throw new Error('Invalid Solana address format');
  }
  
  const transfers = await solana.getTransfers({
    addresses: [walletAddress],
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
  });
  
  console.log(`Found ${transfers.length} Solana transfers for ${walletAddress}`);
  
  return transfers.map(t => ({
    amount: SolanaAdapter.formatTokenAmount(t.amount),
    from: t.sender,
    to: t.recipient,
    token: t.address, // Mint address
    timestamp: t.block_timestamp.toISOString(),
    signature: t.tx_hash,
  }));
}

/**
 * Example 2: Get statistics for a Solana merchant
 */
export async function getSolanaMerchantStats(merchantAddress: string) {
  const solana = new SolanaAdapter('solana');
  
  const stats = await solana.getStatistics({
    addresses: [merchantAddress],
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
  });
  
  return {
    totalSales: stats.total_transactions,
    totalRevenue: SolanaAdapter.formatTokenAmount(stats.total_amount),
    uniqueCustomers: stats.unique_buyers,
    lastSale: stats.latest_block_timestamp,
  };
}

/**
 * Example 3: Track specific SPL token transfers
 * Useful for tracking USDC, USDT, or custom tokens on Solana
 */
export async function trackSPLToken(
  walletAddress: string,
  tokenMint: string
) {
  const solana = new SolanaAdapter('solana');
  
  // Get token metadata first
  const metadata = await solana.getTokenMetadata(tokenMint);
  console.log(`Tracking ${metadata?.symbol || 'Unknown'} (${metadata?.name})`);
  
  const transfers = await solana.getTransfers({
    addresses: [walletAddress],
    tokens: [tokenMint], // Filter by specific token
  });
  
  return {
    tokenInfo: metadata,
    transfers: transfers.map(t => ({
      amount: metadata 
        ? SolanaAdapter.formatTokenAmount(t.amount, metadata.decimals)
        : SolanaAdapter.formatTokenAmount(t.amount),
      from: t.sender,
      to: t.recipient,
      timestamp: t.block_timestamp,
      signature: t.tx_hash,
    })),
  };
}

/**
 * Example 4: Multi-chain comparison - Solana vs Base vs TON
 */
export async function compareMultiChainActivity(walletAddresses: {
  solana: string;
  base: string;
  ton: string;
}) {
  const chains = ['solana', 'base', 'ton'];
  
  const result = await queryRouter.executeMultiChain(
    chains,
    async (engine) => {
      const chainName = engine.getChain();
      const address = walletAddresses[chainName as keyof typeof walletAddresses];
      
      if (!address) {
        throw new Error(`No address provided for ${chainName}`);
      }
      
      return engine.getStatistics({
        addresses: [address],
      });
    },
    { continueOnError: true }
  );

  // Aggregate totals
  const totalTxs = queryRouter.aggregateNumbers(
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
    summary: {
      totalTransactions: totalTxs,
      totalAmount: totalAmount.toString(),
      activeChains: result.availableChains.length,
    },
    perChain: Object.fromEntries(
      Array.from(result.results.entries()).map(([chain, stats]) => [
        chain,
        {
          transactions: stats.total_transactions,
          amount: stats.total_amount.toString(),
          uniqueBuyers: stats.unique_buyers,
          uniqueSellers: stats.unique_sellers,
        },
      ])
    ),
    errors: Object.fromEntries(result.errors),
  };
}

/**
 * Example 5: Real-time Solana payment monitoring
 * Poll for new payments to verify x402 purchases
 */
export async function monitorSolanaPayments(
  merchantAddress: string,
  onNewPayment: (transfer: any) => void
) {
  const solana = new SolanaAdapter('solana');
  let lastCheckedTime = new Date();

  const interval = setInterval(async () => {
    try {
      const transfers = await solana.getTransfers({
        addresses: [merchantAddress],
        startDate: lastCheckedTime,
      });

      if (transfers.length > 0) {
        transfers.forEach(onNewPayment);
        lastCheckedTime = new Date();
      }
    } catch (error) {
      console.error('Error monitoring Solana payments:', error);
    }
  }, 5000); // Check every 5 seconds (Solana is fast!)

  return () => clearInterval(interval);
}

/**
 * Example 6: Verify x402 payment on Solana
 */
export async function verifySolanaPayment(
  merchantAddress: string,
  expectedAmount: bigint,
  tokenMint: string,
  timeWindow: number = 5 * 60 * 1000 // 5 minutes
): Promise<{ verified: boolean; transaction?: any }> {
  const solana = new SolanaAdapter('solana');
  
  const transfers = await solana.getTransfers({
    addresses: [merchantAddress],
    tokens: [tokenMint],
    startDate: new Date(Date.now() - timeWindow),
  });

  // Find matching payment
  const matchingTx = transfers.find(t => 
    t.amount >= expectedAmount &&
    t.recipient === merchantAddress &&
    t.address === tokenMint
  );

  return {
    verified: !!matchingTx,
    transaction: matchingTx ? {
      amount: SolanaAdapter.formatTokenAmount(matchingTx.amount),
      from: matchingTx.sender,
      signature: matchingTx.tx_hash,
      timestamp: matchingTx.block_timestamp,
    } : undefined,
  };
}

/**
 * Example 7: Get popular SPL tokens for a wallet
 */
export async function getWalletTokenActivity(walletAddress: string) {
  const solana = new SolanaAdapter('solana');
  
  const transfers = await solana.getTransfers({
    addresses: [walletAddress],
  });

  // Group by token mint
  const tokenActivity = transfers.reduce((acc, t) => {
    if (!acc[t.address]) {
      acc[t.address] = {
        mint: t.address,
        count: 0,
        totalAmount: BigInt(0),
      };
    }
    acc[t.address].count++;
    acc[t.address].totalAmount += t.amount;
    return acc;
  }, {} as Record<string, { mint: string; count: number; totalAmount: bigint }>);

  // Get metadata for each token
  const tokensWithMetadata = await Promise.all(
    Object.values(tokenActivity).map(async (token) => {
      const metadata = await solana.getTokenMetadata(token.mint);
      return {
        ...token,
        name: metadata?.name || 'Unknown',
        symbol: metadata?.symbol || '???',
        decimals: metadata?.decimals || 9,
        formattedAmount: SolanaAdapter.formatTokenAmount(
          token.totalAmount,
          metadata?.decimals || 9
        ),
      };
    })
  );

  // Sort by transaction count
  return tokensWithMetadata.sort((a, b) => b.count - a.count);
}

/**
 * Example 8: Devnet testing
 */
export async function testOnDevnet(walletAddress: string) {
  const devnet = new SolanaAdapter('solana_devnet');
  
  console.log('Testing on Solana Devnet...');
  
  const isAvailable = await devnet.isAvailable();
  console.log('Devnet available:', isAvailable);
  
  if (isAvailable) {
    const transfers = await devnet.getTransfers({
      addresses: [walletAddress],
    });
    
    console.log(`Found ${transfers.length} devnet transfers`);
    return transfers;
  }
  
  return [];
}