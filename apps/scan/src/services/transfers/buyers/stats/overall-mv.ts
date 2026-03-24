import z from 'zod';
import { Prisma } from '@x402scan/transfers-db';

import { baseQuerySchema } from '../../schemas';
import { createCachedQuery, createStandardCacheKey } from '@/lib/cache';
import { queryRaw } from '@/services/transfers/client';
import { getMaterializedViewSuffix } from '@/lib/time-range';

export const buyerStatisticsMVInputSchema = baseQuerySchema;

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

const getOverallBuyerStatisticsMVUncached = async (
  input: z.infer<typeof buyerStatisticsMVInputSchema>
) => {
  const { timeframe } = input;
  const mvTimeframe = getMaterializedViewSuffix(timeframe);
  const tableName = `sender_stats_aggregated_${mvTimeframe}`;
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

  if (input.senders?.include && input.senders.include.length > 0) {
    conditions.push(
      Prisma.sql`AND sender = ANY(${input.senders.include})`
    );
  }

  if (input.senders?.exclude && input.senders.exclude.length > 0) {
    conditions.push(
      Prisma.sql`AND NOT (sender = ANY(${input.senders.exclude}))`
    );
  }

  const whereClause = Prisma.join(conditions, ' ');

  // Query the appropriate materialized view with new_buyers from sender_first_seen
  // For 0d (all-time), new_buyers equals total_buyers since all buyers were "new" at some point
  const sql = interval
    ? Prisma.sql`
      WITH stats AS (
        SELECT
          COUNT(DISTINCT sender)::int AS total_buyers,
          COALESCE(SUM(total_transactions), 0)::int AS total_transactions,
          COALESCE(SUM(total_amount), 0)::float AS total_amount,
          COALESCE(SUM(unique_sellers), 0)::int AS unique_sellers,
          MAX(latest_block_timestamp) AS latest_block_timestamp
        FROM ${Prisma.raw(tableName)}
        ${whereClause}
      ),
      new_buyers_count AS (
        SELECT COUNT(*)::int AS new_buyers
        FROM sender_first_seen sfs
        WHERE sfs.first_block_timestamp >= NOW() - ${Prisma.raw(`INTERVAL '${interval}'`)}
        ${input.chain ? Prisma.sql`AND sfs.chain = ${input.chain}` : Prisma.empty}
        ${input.senders?.include && input.senders.include.length > 0 ? Prisma.sql`AND sfs.sender = ANY(${input.senders.include})` : Prisma.empty}
        ${input.senders?.exclude && input.senders.exclude.length > 0 ? Prisma.sql`AND NOT (sfs.sender = ANY(${input.senders.exclude}))` : Prisma.empty}
      )
      SELECT
        s.total_buyers,
        s.total_transactions,
        s.total_amount,
        s.unique_sellers,
        s.latest_block_timestamp,
        nb.new_buyers
      FROM stats s, new_buyers_count nb
    `
    : Prisma.sql`
      SELECT
        COUNT(DISTINCT sender)::int AS total_buyers,
        COALESCE(SUM(total_transactions), 0)::int AS total_transactions,
        COALESCE(SUM(total_amount), 0)::float AS total_amount,
        COALESCE(SUM(unique_sellers), 0)::int AS unique_sellers,
        MAX(latest_block_timestamp) AS latest_block_timestamp,
        COUNT(DISTINCT sender)::int AS new_buyers
      FROM ${Prisma.raw(tableName)}
      ${whereClause}
    `;

  const result = await queryRaw(
    sql,
    z.array(
      z.object({
        total_buyers: z.number(),
        total_transactions: z.number(),
        total_amount: z.number(),
        unique_sellers: z.number(),
        latest_block_timestamp: z.date().nullable(),
        new_buyers: z.number(),
      })
    )
  );

  return (
    result[0] ?? {
      total_buyers: 0,
      total_transactions: 0,
      total_amount: 0,
      unique_sellers: 0,
      latest_block_timestamp: null,
      new_buyers: 0,
    }
  );
};

export const getOverallBuyerStatisticsMV = createCachedQuery({
  queryFn: getOverallBuyerStatisticsMVUncached,
  cacheKeyPrefix: 'overall-buyer-statistics-mv',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['latest_block_timestamp'],
  tags: ['statistics', 'buyers'],
});
