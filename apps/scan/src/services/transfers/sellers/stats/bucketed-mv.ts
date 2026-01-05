import z from 'zod';
import { Prisma } from '@x402scan/transfers-db';

import { baseBucketedQuerySchema } from '../../schemas';
import { createCachedArrayQuery, createStandardCacheKey } from '@/lib/cache';
import { queryRaw } from '@/services/transfers/client';
import { getMaterializedViewSuffix } from '@/lib/time-range';

export const bucketedSellerStatisticsMVInputSchema = baseBucketedQuerySchema;

// Raw schema for SQL query (without new_sellers)
const bucketedSellerRawSchema = z.array(
  z.object({
    bucket_start: z.date(),
    total_sellers: z.number(),
    total_transactions: z.number(),
    total_amount: z.number(),
    unique_buyers: z.number(),
  })
);

const getBucketedSellerStatisticsMVUncached = async (
  input: z.infer<typeof bucketedSellerStatisticsMVInputSchema>
) => {
  const { timeframe } = input;

  const mvTimeframe = getMaterializedViewSuffix(timeframe);
  const tableName = `recipient_stats_bucketed_${mvTimeframe}`;

  // Build WHERE clause for materialized view
  const conditions: Prisma.Sql[] = [Prisma.sql`WHERE 1=1`];

  if (input.facilitatorIds && input.facilitatorIds.length > 0) {
    // Note: bucketed views don't have facilitator_ids column
    // This filter would need to be handled differently if needed
  }

  if (input.chain) {
    conditions.push(Prisma.sql`AND chain = ${input.chain}`);
  }

  if (input.recipients?.include && input.recipients.include.length > 0) {
    conditions.push(
      Prisma.sql`AND recipient = ANY(${input.recipients.include})`
    );
  }

  if (input.recipients?.exclude && input.recipients.exclude.length > 0) {
    conditions.push(
      Prisma.sql`AND NOT (recipient = ANY(${input.recipients.exclude}))`
    );
  }

  const whereClause = Prisma.join(conditions, ' ');

  // Query the appropriate materialized view
  const sql = Prisma.sql`
    SELECT 
      bucket AS bucket_start,
      COUNT(DISTINCT recipient)::int AS total_sellers,
      COALESCE(SUM(total_transactions), 0)::int AS total_transactions,
      COALESCE(SUM(total_amount), 0)::float AS total_amount,
      COALESCE(SUM(unique_buyers), 0)::int AS unique_buyers
    FROM ${Prisma.raw(tableName)}
    ${whereClause}
    GROUP BY bucket
    ORDER BY bucket
  `;

  const rawResult = await queryRaw(sql, bucketedSellerRawSchema);

  // Add new_sellers: 0 for backwards compatibility (MVs don't track first transaction dates)
  return rawResult.map(row => ({
    ...row,
    new_sellers: 0,
  }));
};

export const getBucketedSellerStatisticsMV = createCachedArrayQuery({
  queryFn: getBucketedSellerStatisticsMVUncached,
  cacheKeyPrefix: 'bucketed-seller-statistics-mv',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['bucket_start'],
  tags: ['statistics', 'sellers'],
});
