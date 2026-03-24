import z from 'zod';
import { Prisma } from '@x402scan/transfers-db';

import { baseBucketedQuerySchema } from '../../schemas';
import { createCachedArrayQuery, createStandardCacheKey } from '@/lib/cache';
import { queryRaw } from '@/services/transfers/client';
import { getMaterializedViewSuffix } from '@/lib/time-range';

export const bucketedBuyerStatisticsMVInputSchema = baseBucketedQuerySchema;

// Map timeframe suffix to bucket interval for new buyers calculation
// Must match the bucket intervals used in the sender_stats_bucketed MVs
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
  const bucketInterval = getBucketInterval(mvTimeframe);

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

  // Build WHERE conditions for new buyers (same filters applied to sender_first_seen)
  const newBuyersConditions: Prisma.Sql[] = [];

  if (input.chain) {
    newBuyersConditions.push(Prisma.sql`AND sfs.chain = ${input.chain}`);
  }

  if (input.senders?.include && input.senders.include.length > 0) {
    newBuyersConditions.push(
      Prisma.sql`AND sfs.sender = ANY(${input.senders.include})`
    );
  }

  if (input.senders?.exclude && input.senders.exclude.length > 0) {
    newBuyersConditions.push(
      Prisma.sql`AND NOT (sfs.sender = ANY(${input.senders.exclude}))`
    );
  }

  const statsWhereClause = Prisma.join(
    [Prisma.sql`WHERE 1=1`, ...statsConditions],
    ' '
  );
  const newBuyersWhereClause = Prisma.join(
    [Prisma.sql`WHERE 1=1`, ...newBuyersConditions],
    ' '
  );

  // Query bucketed stats with new_buyers computed from sender_first_seen
  // Uses LEFT JOIN to include buckets even if no new buyers exist
  const sql = Prisma.sql`
    WITH bucketed_stats AS (
      SELECT
        ssb.bucket AS bucket_start,
        COUNT(DISTINCT ssb.sender)::int AS total_buyers,
        COALESCE(SUM(ssb.total_transactions), 0)::int AS total_transactions,
        COALESCE(SUM(ssb.total_amount), 0)::float AS total_amount,
        COALESCE(SUM(ssb.unique_sellers), 0)::int AS unique_sellers
      FROM ${Prisma.raw(tableName)} ssb
      ${statsWhereClause}
      GROUP BY ssb.bucket
    ),
    new_buyers_per_bucket AS (
      SELECT
        time_bucket(${Prisma.raw(`'${bucketInterval}'`)}::interval, sfs.first_block_timestamp) AS bucket_start,
        COUNT(*)::int AS new_buyers
      FROM sender_first_seen sfs
      ${newBuyersWhereClause}
      GROUP BY 1
    )
    SELECT
      bs.bucket_start,
      bs.total_buyers,
      bs.total_transactions,
      bs.total_amount,
      bs.unique_sellers,
      COALESCE(nb.new_buyers, 0)::int AS new_buyers
    FROM bucketed_stats bs
    LEFT JOIN new_buyers_per_bucket nb ON bs.bucket_start = nb.bucket_start
    ORDER BY bs.bucket_start
  `;

  return queryRaw(sql, bucketedBuyerResultSchema);
};

export const getBucketedBuyerStatisticsMV = createCachedArrayQuery({
  queryFn: getBucketedBuyerStatisticsMVUncached,
  cacheKeyPrefix: 'bucketed-buyer-statistics-mv',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['bucket_start'],
  tags: ['statistics', 'buyers'],
});
