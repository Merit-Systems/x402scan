import z from 'zod';
import { Prisma } from '@x402scan/transfers-db';

import { baseQuerySchema } from '../../schemas';
import { createCachedQuery, createStandardCacheKey } from '@/lib/cache';
import { queryRaw } from '@/services/transfers/client';
import { getMaterializedViewSuffix } from '@/lib/time-range';

export const sellerStatisticsMVInputSchema = baseQuerySchema;

// Map timeframe suffix to PostgreSQL interval
const getTimeframeInterval = (mvTimeframe: string): string | null => {
  const intervalMap: Record<string, string> = {
    '1d': '1 day',
    '7d': '7 days',
    '14d': '14 days',
    '30d': '30 days',
  };
  return intervalMap[mvTimeframe] ?? null;
};

const getOverallSellerStatisticsMVUncached = async (
  input: z.infer<typeof sellerStatisticsMVInputSchema>
) => {
  const { timeframe } = input;
  const mvTimeframe = getMaterializedViewSuffix(timeframe);
  const tableName = `recipient_stats_aggregated_${mvTimeframe}`;
  const interval = getTimeframeInterval(mvTimeframe);

  // Build WHERE clause for materialized view
  const conditions: Prisma.Sql[] = [Prisma.sql`WHERE 1=1`];

  if (input.facilitatorIds && input.facilitatorIds.length > 0) {
    conditions.push(
      Prisma.sql`AND ${input.facilitatorIds}::text[] && facilitator_ids`
    );
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

  // Query the appropriate materialized view with new_sellers from recipient_first_seen
  // For 0d (all-time), new_sellers equals total_sellers since all sellers were "new" at some point
  const sql = interval
    ? Prisma.sql`
      WITH stats AS (
        SELECT 
          COUNT(DISTINCT recipient)::int AS total_sellers,
          COALESCE(SUM(total_transactions), 0)::int AS total_transactions,
          COALESCE(SUM(total_amount), 0)::float AS total_amount,
          COALESCE(SUM(unique_buyers), 0)::int AS unique_buyers,
          MAX(latest_block_timestamp) AS latest_block_timestamp
        FROM ${Prisma.raw(tableName)}
        ${whereClause}
      ),
      new_sellers_count AS (
        SELECT COUNT(*)::int AS new_sellers
        FROM recipient_first_seen rfs
        WHERE rfs.first_block_timestamp >= NOW() - ${Prisma.raw(`INTERVAL '${interval}'`)}
        ${input.chain ? Prisma.sql`AND rfs.chain = ${input.chain}` : Prisma.empty}
        ${input.recipients?.include && input.recipients.include.length > 0 ? Prisma.sql`AND rfs.recipient = ANY(${input.recipients.include})` : Prisma.empty}
        ${input.recipients?.exclude && input.recipients.exclude.length > 0 ? Prisma.sql`AND NOT (rfs.recipient = ANY(${input.recipients.exclude}))` : Prisma.empty}
      )
      SELECT 
        s.total_sellers,
        s.total_transactions,
        s.total_amount,
        s.unique_buyers,
        s.latest_block_timestamp,
        ns.new_sellers
      FROM stats s, new_sellers_count ns
    `
    : Prisma.sql`
      SELECT 
        COUNT(DISTINCT recipient)::int AS total_sellers,
        COALESCE(SUM(total_transactions), 0)::int AS total_transactions,
        COALESCE(SUM(total_amount), 0)::float AS total_amount,
        COALESCE(SUM(unique_buyers), 0)::int AS unique_buyers,
        MAX(latest_block_timestamp) AS latest_block_timestamp,
        COUNT(DISTINCT recipient)::int AS new_sellers
      FROM ${Prisma.raw(tableName)}
      ${whereClause}
    `;

  const result = await queryRaw(
    sql,
    z.array(
      z.object({
        total_sellers: z.number(),
        total_transactions: z.number(),
        total_amount: z.number(),
        unique_buyers: z.number(),
        latest_block_timestamp: z.date().nullable(),
        new_sellers: z.number(),
      })
    )
  );

  return (
    result[0] ?? {
      total_sellers: 0,
      total_transactions: 0,
      total_amount: 0,
      unique_buyers: 0,
      latest_block_timestamp: null,
      new_sellers: 0,
    }
  );
};

export const getOverallSellerStatisticsMV = createCachedQuery({
  queryFn: getOverallSellerStatisticsMVUncached,
  cacheKeyPrefix: 'overall-seller-statistics-mv',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['latest_block_timestamp'],
  tags: ['statistics', 'sellers'],
});
