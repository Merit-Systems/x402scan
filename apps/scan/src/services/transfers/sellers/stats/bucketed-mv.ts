import z from 'zod';
import { Prisma } from '@x402scan/transfers-db';

import { baseBucketedQuerySchema } from '../../schemas';
import { createCachedArrayQuery, createStandardCacheKey } from '@/lib/cache';
import { queryRaw } from '@/services/transfers/client';
import { getMaterializedViewSuffix } from '@/lib/time-range';

export const bucketedSellerStatisticsMVInputSchema = baseBucketedQuerySchema;

// Map timeframe suffix to bucket interval for new sellers calculation
// Must match the bucket intervals used in the recipient_stats_bucketed MVs
const getBucketInterval = (mvTimeframe: string): string => {
  const intervalMap: Record<string, string> = {
    '1d': '30 minutes',
    '7d': '3 hours 30 minutes',
    '14d': '7 hours',
    '30d': '15 hours',
    '0d': '1 day',
  };
  return intervalMap[mvTimeframe] ?? '1 day';
};

const bucketedSellerResultSchema = z.array(
  z.object({
    bucket_start: z.date(),
    total_sellers: z.number(),
    total_transactions: z.number(),
    total_amount: z.number(),
    unique_buyers: z.number(),
    new_sellers: z.number(),
  })
);

// Exported for use when calling from within another cached function
// to avoid creating huge cache keys with many addresses
export const getBucketedSellerStatisticsMVUncached = async (
  input: z.infer<typeof bucketedSellerStatisticsMVInputSchema>
) => {
  const { timeframe } = input;

  const mvTimeframe = getMaterializedViewSuffix(timeframe);
  const tableName = `recipient_stats_bucketed_${mvTimeframe}`;
  const bucketInterval = getBucketInterval(mvTimeframe);

  // Build WHERE conditions for bucketed stats
  const statsConditions: Prisma.Sql[] = [];

  if (input.chain) {
    statsConditions.push(Prisma.sql`AND rsb.chain = ${input.chain}`);
  }

  if (input.recipients?.include && input.recipients.include.length > 0) {
    statsConditions.push(
      Prisma.sql`AND rsb.recipient = ANY(${input.recipients.include})`
    );
  }

  if (input.recipients?.exclude && input.recipients.exclude.length > 0) {
    statsConditions.push(
      Prisma.sql`AND NOT (rsb.recipient = ANY(${input.recipients.exclude}))`
    );
  }

  // Build WHERE conditions for new sellers (same filters applied to recipient_first_seen)
  const newSellersConditions: Prisma.Sql[] = [];

  if (input.chain) {
    newSellersConditions.push(Prisma.sql`AND rfs.chain = ${input.chain}`);
  }

  if (input.recipients?.include && input.recipients.include.length > 0) {
    newSellersConditions.push(
      Prisma.sql`AND rfs.recipient = ANY(${input.recipients.include})`
    );
  }

  if (input.recipients?.exclude && input.recipients.exclude.length > 0) {
    newSellersConditions.push(
      Prisma.sql`AND NOT (rfs.recipient = ANY(${input.recipients.exclude}))`
    );
  }

  const statsWhereClause = Prisma.join(
    [Prisma.sql`WHERE 1=1`, ...statsConditions],
    ' '
  );
  const newSellersWhereClause = Prisma.join(
    [Prisma.sql`WHERE 1=1`, ...newSellersConditions],
    ' '
  );

  // Query bucketed stats with new_sellers computed from recipient_first_seen
  // Uses LEFT JOIN to include buckets even if no new sellers exist
  // Note: bucketInterval must be inlined with Prisma.raw() so the GROUP BY expression
  // matches the SELECT expression exactly (PostgreSQL's GROUP BY matching is syntactic)
  const sql = Prisma.sql`
    WITH bucketed_stats AS (
      SELECT 
        rsb.bucket AS bucket_start,
        COUNT(DISTINCT rsb.recipient)::int AS total_sellers,
        COALESCE(SUM(rsb.total_transactions), 0)::int AS total_transactions,
        COALESCE(SUM(rsb.total_amount), 0)::float AS total_amount,
        COALESCE(SUM(rsb.unique_buyers), 0)::int AS unique_buyers
      FROM ${Prisma.raw(tableName)} rsb
      ${statsWhereClause}
      GROUP BY rsb.bucket
    ),
    new_sellers_per_bucket AS (
      SELECT 
        time_bucket(${Prisma.raw(`'${bucketInterval}'`)}::interval, rfs.first_block_timestamp) AS bucket_start,
        COUNT(*)::int AS new_sellers
      FROM recipient_first_seen rfs
      ${newSellersWhereClause}
      GROUP BY 1
    )
    SELECT 
      bs.bucket_start,
      bs.total_sellers,
      bs.total_transactions,
      bs.total_amount,
      bs.unique_buyers,
      COALESCE(ns.new_sellers, 0)::int AS new_sellers
    FROM bucketed_stats bs
    LEFT JOIN new_sellers_per_bucket ns ON bs.bucket_start = ns.bucket_start
    ORDER BY bs.bucket_start
  `;

  return queryRaw(sql, bucketedSellerResultSchema);
};

export const getBucketedSellerStatisticsMV = createCachedArrayQuery({
  queryFn: getBucketedSellerStatisticsMVUncached,
  cacheKeyPrefix: 'bucketed-seller-statistics-mv',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['bucket_start'],
  tags: ['statistics', 'sellers'],
});
