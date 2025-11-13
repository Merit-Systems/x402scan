import z from 'zod';
import { Prisma } from '../../../../../../../databases/transfers/src';

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
  const sql = Prisma.sql`
    WITH seller_first_transactions AS (
      SELECT 
        recipient,
        MIN(block_timestamp) AS first_transaction_date
      FROM "TransferEvent"
      GROUP BY recipient
    ),
    filtered_transfers AS (
      SELECT DISTINCT t.recipient
      FROM "TransferEvent" t
      ${transfersWhereClause(input)}
    )
    SELECT 
      COUNT(DISTINCT ft.recipient)::int AS total_sellers,
      COUNT(DISTINCT CASE 
        WHEN sft.first_transaction_date >= ${startDate ?? Prisma.sql`'1970-01-01'::timestamp`}
         AND sft.first_transaction_date <= ${endDate ?? Prisma.sql`NOW()`}
        THEN ft.recipient 
      END)::int AS new_sellers
    FROM filtered_transfers ft
    LEFT JOIN seller_first_transactions sft ON ft.recipient = sft.recipient
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
