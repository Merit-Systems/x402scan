import z from 'zod';
import { Prisma } from '@prisma/client';
import { queryRaw } from '../query';

export const getWalletSnapshotAggregatesSchema = z.object({
  days: z.number().int().positive(),
});

export const walletSnapshotAggregateSchema = z.object({
  timestamp: z.coerce.date(),
  num_wallets: z.number().int(),
  balance: z.bigint(),
});

export const walletSnapshotAggregatesResultSchema = z.array(
  walletSnapshotAggregateSchema
);

/**
 * Get wallet snapshot aggregates for a given time period
 */
export async function getWalletSnapshotAggregates(
  input: z.infer<typeof getWalletSnapshotAggregatesSchema>
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - input.days);

  return queryRaw(
    Prisma.sql`
      SELECT 
        timestamp,
        COUNT(DISTINCT(accountAddress))::int as num_wallets,
        SUM(amount)::bigint as balance
      FROM "WalletSnapshot"
      WHERE timestamp >= ${startDate}
      GROUP BY timestamp
      ORDER BY timestamp DESC
    `,
    walletSnapshotAggregatesResultSchema
  );
}