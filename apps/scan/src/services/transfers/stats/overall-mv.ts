import z from 'zod';
import { Prisma } from '@x402scan/transfers-db';

import { baseQuerySchema } from '../schemas';
import { createCachedQuery, createStandardCacheKey } from '@/lib/cache';
import { queryRaw } from '@/services/transfers/client';
import { getMaterializedViewSuffix } from '@/lib/time-range';

export const overallStatisticsMVInputSchema = baseQuerySchema;

const getOverallStatisticsMVUncached = async (
  input: z.infer<typeof overallStatisticsMVInputSchema>
) => {
  const { timeframe, recipients } = input;
  const mvTimeframe = getMaterializedViewSuffix(timeframe);

  // Use recipient-specific materialized view when filtering by recipients
  const hasRecipientFilter =
    (recipients?.include && recipients.include.length > 0) ||
    (recipients?.exclude && recipients.exclude.length > 0);

  const tableName = hasRecipientFilter
    ? `recipient_stats_aggregated_${mvTimeframe}`
    : `stats_aggregated_${mvTimeframe}`;

  // Build WHERE clause for materialized view
  const conditions: Prisma.Sql[] = [Prisma.sql`WHERE 1=1`];

  if (input.facilitatorIds && input.facilitatorIds.length > 0) {
    // Recipient stats tables use facilitator_ids array, aggregated stats use facilitator_id
    if (hasRecipientFilter) {
      conditions.push(
        Prisma.sql`AND ${input.facilitatorIds}::text[] && facilitator_ids`
      );
    } else {
      conditions.push(
        Prisma.sql`AND facilitator_id = ANY(${input.facilitatorIds})`
      );
    }
  }

  if (input.chain) {
    conditions.push(Prisma.sql`AND chain = ${input.chain}`);
  }

  if (recipients?.include && recipients.include.length > 0) {
    conditions.push(Prisma.sql`AND recipient = ANY(${recipients.include})`);
  }

  if (recipients?.exclude && recipients.exclude.length > 0) {
    conditions.push(
      Prisma.sql`AND NOT (recipient = ANY(${recipients.exclude}))`
    );
  }

  const whereClause = Prisma.join(conditions, ' ');

  // Query the appropriate materialized view
  // Note: recipient_stats_aggregated tables don't have unique_sellers column,
  // so we compute it as COUNT(DISTINCT recipient)
  const sql = hasRecipientFilter
    ? Prisma.sql`
      SELECT 
        COALESCE(SUM(total_transactions), 0)::int AS total_transactions,
        COALESCE(SUM(total_amount), 0)::float AS total_amount,
        COALESCE(SUM(unique_buyers), 0)::int AS unique_buyers,
        COUNT(DISTINCT recipient)::int AS unique_sellers,
        MAX(latest_block_timestamp) AS latest_block_timestamp
      FROM ${Prisma.raw(tableName)}
      ${whereClause}
    `
    : Prisma.sql`
      SELECT 
        COALESCE(SUM(total_transactions), 0)::int AS total_transactions,
        COALESCE(SUM(total_amount), 0)::float AS total_amount,
        COALESCE(SUM(unique_buyers), 0)::int AS unique_buyers,
        COALESCE(SUM(unique_sellers), 0)::int AS unique_sellers,
        MAX(latest_block_timestamp) AS latest_block_timestamp
      FROM ${Prisma.raw(tableName)}
      ${whereClause}
    `;

  const result = await queryRaw(
    sql,
    z.array(
      z.object({
        total_transactions: z.number(),
        total_amount: z.number(),
        unique_buyers: z.number(),
        unique_sellers: z.number(),
        latest_block_timestamp: z.date().nullable(),
      })
    )
  );

  return (
    result[0] ?? {
      total_transactions: 0,
      total_amount: 0,
      unique_buyers: 0,
      unique_sellers: 0,
      latest_block_timestamp: new Date(),
    }
  );
};

export const getOverallStatisticsMV = createCachedQuery({
  queryFn: getOverallStatisticsMVUncached,
  cacheKeyPrefix: 'overall-statistics-mv',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['latest_block_timestamp'],
  tags: ['statistics'],
});
