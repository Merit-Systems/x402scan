import z from 'zod';
import { Prisma } from '@x402scan/transfers-db';

import { queryRaw } from '@/services/transfers/client';

export const buyerStatsAggregatedInputSchema = z.object({
  wallets: z.array(z.string()),
});

const aggregatedBuyerResultSchema = z.array(
  z.object({
    sender: z.string(),
    total_transactions: z.number(),
    total_amount: z.number(),
  })
);

export const getBuyerStatsAggregated = async (
  input: z.infer<typeof buyerStatsAggregatedInputSchema>
) => {
  const { wallets } = input;

  if (wallets.length === 0) {
    return [];
  }

  // Include both original case and lowercase versions of wallets
  const lowercaseWallets = wallets.map(w => w.toLowerCase());
  const allWallets = [...new Set([...wallets, ...lowercaseWallets])];

  // Query the sender stats MV (all-time) for multiple wallets
  // This is much faster than querying the raw TransferEvent table
  const sql = Prisma.sql`
    SELECT
      LOWER(sender) AS sender,
      COALESCE(SUM(total_transactions), 0)::int AS total_transactions,
      COALESCE(SUM(total_amount), 0)::float AS total_amount
    FROM sender_stats_aggregated_0d
    WHERE sender = ANY(${allWallets})
    GROUP BY LOWER(sender)
  `;

  return queryRaw(sql, aggregatedBuyerResultSchema);
};
