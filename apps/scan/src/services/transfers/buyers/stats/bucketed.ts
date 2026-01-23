import z from 'zod';
import { Prisma } from '@x402scan/transfers-db';

import { createCachedArrayQuery, createStandardCacheKey } from '@/lib/cache';
import { queryRaw } from '@/services/transfers/client';
import { getMaterializedViewSuffix } from '@/lib/time-range';
import { timePeriodSchema } from '@/lib/schemas';

export const buyerStatsBucketedInputSchema = z.object({
  wallet: z.string(),
  timeframe: timePeriodSchema,
  numBuckets: z.number().default(48),
});

const bucketedBuyerResultSchema = z.array(
  z.object({
    bucket_start: z.date(),
    total_transactions: z.number(),
    total_amount: z.number(),
  })
);

const getBuyerStatsBucketedUncached = async (
  input: z.infer<typeof buyerStatsBucketedInputSchema>
) => {
  const { wallet, timeframe } = input;
  const mvTimeframe = getMaterializedViewSuffix(timeframe);
  const tableName = `sender_stats_bucketed_${mvTimeframe}`;

  // Query the sender stats bucketed materialized view
  // Try both original case and lowercase to handle different storage formats
  const walletLower = wallet.toLowerCase();

  const sql = Prisma.sql`
    SELECT
      bucket AS bucket_start,
      COALESCE(SUM(total_transactions), 0)::int AS total_transactions,
      COALESCE(SUM(total_amount), 0)::float AS total_amount
    FROM ${Prisma.raw(tableName)}
    WHERE sender IN (${wallet}, ${walletLower})
    GROUP BY bucket
    ORDER BY bucket
  `;

  return queryRaw(sql, bucketedBuyerResultSchema);
};

export const getBuyerStatsBucketed = createCachedArrayQuery({
  queryFn: getBuyerStatsBucketedUncached,
  cacheKeyPrefix: 'buyer-stats-bucketed',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['bucket_start'],
  tags: ['statistics', 'buyers'],
});
