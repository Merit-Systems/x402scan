import z from 'zod';
import { Prisma } from '@x402scan/transfers-db';

import { baseQuerySchema } from '../../schemas';
import { createCachedQuery, createStandardCacheKey } from '@/lib/cache';
import { queryRaw } from '@/services/transfers/client';
import { transfersWhereClause } from '../../query-utils';
import { getTimeRangeFromTimeframe } from '@/lib/time-range';

export const sellerStatisticsInputSchema = baseQuerySchema;

const getOverallSellerStatisticsUncached = async (
  input: z.infer<typeof sellerStatisticsInputSchema>
) => {
  const { startDate, endDate } = getTimeRangeFromTimeframe(input.timeframe);

  // Use the recipient_first_transaction materialized view for fast lookups
  // This avoids scanning all hypertable chunks to compute MIN(block_timestamp)
  const sql = Prisma.sql`
    WITH filtered_transfers AS (
      SELECT DISTINCT t.recipient
      FROM "TransferEvent" t
      ${transfersWhereClause(input)}
    )
    SELECT 
      COUNT(DISTINCT ft.recipient)::int AS total_sellers,
      COUNT(DISTINCT CASE 
        WHEN rft.first_transaction_date >= ${startDate ?? Prisma.sql`'1970-01-01'::timestamp`}
         AND rft.first_transaction_date <= ${endDate ?? Prisma.sql`NOW()`}
        THEN ft.recipient 
      END)::int AS new_sellers
    FROM filtered_transfers ft
    LEFT JOIN recipient_first_transaction rft ON ft.recipient = rft.recipient
  `;

  const result = await queryRaw(
    sql,
    z.array(
      z.object({
        total_sellers: z.number(),
        new_sellers: z.number(),
      })
    )
  );

  return (
    result[0] ?? {
      total_sellers: 0,
      new_sellers: 0,
    }
  );
};

export const getOverallSellerStatistics = createCachedQuery({
  queryFn: getOverallSellerStatisticsUncached,
  cacheKeyPrefix: 'overall-seller-statistics',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: [],
  tags: ['statistics', 'sellers'],
});
