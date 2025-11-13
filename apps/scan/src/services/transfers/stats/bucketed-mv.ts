import z from 'zod';
import { Prisma } from '../../../../../../databases/transfers/src';

import { baseBucketedQuerySchema } from '../schemas';
import { createCachedArrayQuery, createStandardCacheKey } from '@/lib/cache';
import { queryRaw } from '@/services/transfers/client';
import { getMaterializedViewSuffix } from '@/lib/time-range';

export const bucketedStatisticsMVInputSchema = baseBucketedQuerySchema;

const bucketedResultSchema = z.array(
  z.object({
    bucket_start: z.date(),
    total_transactions: z.number(),
    total_amount: z.number(),
    unique_buyers: z.number(),
    unique_sellers: z.number(),
  })
);

const getBucketedStatisticsMVUncached = async (
  input: z.infer<typeof bucketedStatisticsMVInputSchema>
) => {
  const { timeframe } = input;

  const mvTimeframe = getMaterializedViewSuffix(timeframe);
  const tableName = `stats_buckets_${mvTimeframe}`;

  // Build WHERE clause for materialized view
  const conditions: Prisma.Sql[] = [Prisma.sql`WHERE 1=1`];

  if (input.facilitatorIds && input.facilitatorIds.length > 0) {
    conditions.push(
      Prisma.sql`AND facilitator_id = ANY(${input.facilitatorIds})`
    );
  }

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
      COALESCE(SUM(unique_buyers), 0)::int AS unique_buyers,
      COALESCE(SUM(unique_sellers), 0)::int AS unique_sellers
    FROM ${Prisma.raw(tableName)}
    ${whereClause}
    GROUP BY bucket
    ORDER BY bucket
  `;

  const rawResult = await queryRaw(sql, bucketedResultSchema);

  const transformedResult = rawResult.map(row => ({
    ...row,
    total_amount:
      typeof row.total_amount === 'number'
        ? row.total_amount
        : Number(row.total_amount),
  }));

  return bucketedResultSchema.parse(transformedResult);
};

export const getBucketedStatisticsMV = createCachedArrayQuery({
  queryFn: getBucketedStatisticsMVUncached,
  cacheKeyPrefix: 'bucketed-statistics-mv',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['bucket_start'],
  tags: ['statistics'],
});
