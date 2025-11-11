import z from 'zod';
import { Prisma } from '@prisma/client';

import { baseQuerySchema } from '../schemas';
import { createCachedQuery, createStandardCacheKey } from '@/lib/cache';
import { queryRaw } from '@/services/transfers/client';
import { ActivityTimeframe } from '@/types/timeframes';
import { differenceInDays } from 'date-fns';

// Schema accepts ActivityTimeframe or date range
export const overallStatisticsMvInputSchema = baseQuerySchema.extend({
  timeframe: z.nativeEnum(ActivityTimeframe).optional(),
});

// Convert ActivityTimeframe to MV table suffix
const getTimeframeForMV = (
  timeframe?: ActivityTimeframe,
  startDate?: Date,
  endDate?: Date
): '1d' | '7d' | '14d' | '30d' | null => {
  // If timeframe is provided, use it
  if (timeframe !== undefined) {
    switch (timeframe) {
      case ActivityTimeframe.OneDay:
        return '1d';
      case ActivityTimeframe.SevenDays:
        return '7d';
      case ActivityTimeframe.FourteenDays:
        return '14d';
      case ActivityTimeframe.ThirtyDays:
        return '30d';
      default:
        return null;
    }
  }

  // If no timeframe but dates provided, calculate days difference
  if (startDate && endDate) {
    const days = differenceInDays(endDate, startDate);
    if (days <= 1) return '1d';
    if (days <= 7) return '7d';
    if (days <= 14) return '14d';
    if (days <= 30) return '30d';
  }

  return null;
};

const getOverallStatisticsMVUncached = async (
  input: z.infer<typeof overallStatisticsMvInputSchema>
) => {
  // Determine which MV to use
  const mvTimeframe = getTimeframeForMV(input.timeframe, input.startDate, input.endDate);
  
  // If no suitable MV exists, return null (caller should fallback to regular query)
  if (!mvTimeframe) {
    throw new Error('No suitable materialized view for the given timeframe');
  }

  // Generate table name based on timeframe
  const tableName = `stats_aggregated_${mvTimeframe}`;

  // Build WHERE clause for materialized view
  const conditions: Prisma.Sql[] = [Prisma.sql`WHERE 1=1`];

  if (input.facilitatorIds && input.facilitatorIds.length > 0) {
    conditions.push(Prisma.sql`AND facilitator_id = ANY(${input.facilitatorIds})`);
  }

  if (input.chain) {
    conditions.push(Prisma.sql`AND chain = ${input.chain}`);
  }

  const whereClause = Prisma.join(conditions, ' ');

  // Query the appropriate materialized view
  const sql = Prisma.sql`
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