import { prisma } from "@/services/db/client";

export interface WalletSnapshotAggregate {
  timestamp: Date;
  num_wallets: number;
  balance: bigint;
}

/**
 * Get wallet snapshot aggregates for a given time period
 * @param days Number of days to look back from now
 */
export async function getWalletSnapshotAggregates(
  days: number
): Promise<WalletSnapshotAggregate[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const result = await prisma.$queryRaw<WalletSnapshotAggregate[]>`
    SELECT 
      timestamp,
      COUNT(DISTINCT(accountAddress))::int as num_wallets,
      SUM(amount)::bigint as balance
    FROM "WalletSnapshot"
    WHERE timestamp >= ${startDate}
    GROUP BY timestamp
    ORDER BY timestamp DESC
  `;

  return result;
}