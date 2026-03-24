import z from 'zod';
import { Prisma } from '@x402scan/transfers-db';

import { baseBucketedQuerySchema } from '../../schemas';
import { createCachedArrayQuery, createStandardCacheKey } from '@/lib/cache';
import { queryRaw } from '@/services/transfers/client';
import { getMaterializedViewSuffix } from '@/lib/time-range';

export const bucketedBuyerStatisticsMVInputSchema = baseBucketedQuerySchema;

const bucketedBuyerResultSchema = z.array(
  z.object({
    bucket_start: z.date(),
    total_buyers: z.number(),
    total_transactions: z.number(),
    total_amount: z.number(),
    unique_sellers: z.number(),
    new_buyers: z.number(),
  })
);

const getBucketedBuyerStatisticsMVUncached = async (
  input: z.infer<typeof bucketedBuyerStatisticsMVInputSchema>
) => {
  const { timeframe } = input;

  const mvTimeframe = getMaterializedViewSuffix(timeframe);
  const tableName = `sender_stats_bucketed_${mvTimeframe}`;

  // Build WHERE conditions for bucketed stats
  const statsConditions: Prisma.Sql[] = [];

  if (input.chain) {
    statsConditions.push(Prisma.sql`AND ssb.chain = ${input.chain}`);
  }

  if (input.senders?.include && input.senders.include.length > 0) {
    statsConditions.push(
      Prisma.sql`AND ssb.sender = ANY(${input.senders.include})`
    );
  }

  if (input.senders?.exclude && input.senders.exclude.length > 0) {
    statsConditions.push(
      Prisma.sql`AND NOT (ssb.sender = ANY(${input.senders.exclude}))`
    );
  }

  const statsWhereClause = Prisma.join(
    [Prisma.sql`WHERE 1=1`, ...statsConditions],
    ' '
  );

  // Query bucketed stats — new_buyers omitted for now (requires sender_first_seen MV)
  const sql = Prisma.sql`
    SELECT
      ssb.bucket AS bucket_start,
      COUNT(DISTINCT ssb.sender)::int AS total_buyers,
      COALESCE(SUM(ssb.total_transactions), 0)::int AS total_transactions,
      COALESCE(SUM(ssb.total_amount), 0)::float AS total_amount,
      COALESCE(SUM(ssb.unique_sellers), 0)::int AS unique_sellers,
      0::int AS new_buyers
    FROM ${Prisma.raw(tableName)} ssb
    ${statsWhereClause}
    GROUP BY ssb.bucket
    ORDER BY ssb.bucket
  `;

  try {
    return await queryRaw(sql, bucketedBuyerResultSchema);
  } catch (error) {
    if (String(error).includes('does not exist')) {
      console.warn(`[buyer-stats] MV ${tableName} not yet available, returning empty`);
      return [];
    }
    throw error;
  }
};

export const getBucketedBuyerStatisticsMV = createCachedArrayQuery({
  queryFn: getBucketedBuyerStatisticsMVUncached,
  cacheKeyPrefix: 'bucketed-buyer-statistics-mv',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['bucket_start'],
  tags: ['statistics', 'buyers'],
});
