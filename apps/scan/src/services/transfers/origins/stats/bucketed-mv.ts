import z from 'zod';
import { Prisma } from '@x402scan/transfers-db';

import { baseBucketedQuerySchema } from '../../schemas';
import { createCachedArrayQuery, createStandardCacheKey } from '@/lib/cache';
import { queryRaw } from '@/services/transfers/client';
import { getMaterializedViewSuffix } from '@/lib/time-range';

export const bucketedOriginStatisticsMVInputSchema =
  baseBucketedQuerySchema.extend({
    originIds: z.array(z.string()).optional(),
  });

const bucketedOriginResultSchema = z.array(
  z.object({
    bucket_start: z.date(),
    total_origins: z.number(),
    total_transactions: z.number(),
    total_amount: z.number(),
    unique_buyers: z.number(),
  })
);

const getBucketedOriginStatisticsMVUncached = async (
  input: z.infer<typeof bucketedOriginStatisticsMVInputSchema>
) => {
  const { timeframe } = input;

  const mvTimeframe = getMaterializedViewSuffix(timeframe);
  const tableName = `origin_stats_bucketed_${mvTimeframe}`;

  // Build WHERE clause for materialized view
  const conditions: Prisma.Sql[] = [Prisma.sql`WHERE 1=1`];

  if (input.chain) {
    conditions.push(Prisma.sql`AND chain = ${input.chain}`);
  }

  if (input.originIds && input.originIds.length > 0) {
    conditions.push(Prisma.sql`AND "originId" = ANY(${input.originIds})`);
  }

  const whereClause = Prisma.join(conditions, ' ');

  // Query the appropriate materialized view
  const sql = Prisma.sql`
    SELECT 
      bucket AS bucket_start,
      COUNT(DISTINCT "originId")::int AS total_origins,
      COALESCE(SUM(total_transactions), 0)::int AS total_transactions,
      COALESCE(SUM(total_amount), 0)::float AS total_amount,
      COALESCE(SUM(unique_buyers), 0)::int AS unique_buyers
    FROM ${Prisma.raw(tableName)}
    ${whereClause}
    GROUP BY bucket
    ORDER BY bucket
  `;

  const rawResult = await queryRaw(sql, bucketedOriginResultSchema);

  const transformedResult = rawResult.map(row => ({
    ...row,
    total_amount:
      typeof row.total_amount === 'number'
        ? row.total_amount
        : Number(row.total_amount),
  }));

  return bucketedOriginResultSchema.parse(transformedResult);
};

export const getBucketedOriginStatisticsMV = createCachedArrayQuery({
  queryFn: getBucketedOriginStatisticsMVUncached,
  cacheKeyPrefix: 'bucketed-origin-statistics-mv',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['bucket_start'],
  tags: ['statistics', 'origins'],
});

// Single origin bucketed stats - for querying a specific origin over time
export const singleOriginBucketedStatsMVInputSchema =
  baseBucketedQuerySchema.extend({
    originId: z.string(),
  });

const singleOriginBucketedResultSchema = z.array(
  z.object({
    bucket_start: z.date(),
    total_transactions: z.number(),
    total_amount: z.number(),
    unique_buyers: z.number(),
  })
);

const getSingleOriginBucketedStatsMVUncached = async (
  input: z.infer<typeof singleOriginBucketedStatsMVInputSchema>
) => {
  const { timeframe, originId } = input;

  const mvTimeframe = getMaterializedViewSuffix(timeframe);
  const tableName = `origin_stats_bucketed_${mvTimeframe}`;

  // Build WHERE clause for materialized view
  const conditions: Prisma.Sql[] = [Prisma.sql`WHERE "originId" = ${originId}`];

  if (input.chain) {
    conditions.push(Prisma.sql`AND chain = ${input.chain}`);
  }

  const whereClause = Prisma.join(conditions, ' ');

  // Query the appropriate materialized view
  const sql = Prisma.sql`
    SELECT 
      bucket AS bucket_start,
      COALESCE(SUM(total_transactions), 0)::int AS total_transactions,
      COALESCE(SUM(total_amount), 0)::float AS total_amount,
      COALESCE(SUM(unique_buyers), 0)::int AS unique_buyers
    FROM ${Prisma.raw(tableName)}
    ${whereClause}
    GROUP BY bucket
    ORDER BY bucket
  `;

  const rawResult = await queryRaw(sql, singleOriginBucketedResultSchema);

  const transformedResult = rawResult.map(row => ({
    ...row,
    total_amount:
      typeof row.total_amount === 'number'
        ? row.total_amount
        : Number(row.total_amount),
  }));

  return singleOriginBucketedResultSchema.parse(transformedResult);
};

export const getSingleOriginBucketedStatsMV = createCachedArrayQuery({
  queryFn: getSingleOriginBucketedStatsMVUncached,
  cacheKeyPrefix: 'single-origin-bucketed-statistics-mv',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['bucket_start'],
  tags: ['statistics', 'origins'],
});
