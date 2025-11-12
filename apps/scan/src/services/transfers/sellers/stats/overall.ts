import z from 'zod';

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
  const whereClause = transfersWhereClause(input);

  const startDateStr = startDate
    ? `'${startDate.toISOString()}'`
    : `'1970-01-01 00:00:00'`;
  const endDateStr = endDate ? `'${endDate.toISOString()}'` : 'NOW()';

  const sql = `
    WITH seller_first_transactions AS (
      SELECT 
        recipient,
        MIN(block_timestamp) AS first_transaction_date
      FROM public_TransferEvent
      GROUP BY recipient
    ),
    filtered_transfers AS (
      SELECT DISTINCT recipient
      FROM public_TransferEvent
      ${whereClause}
    )
    SELECT 
      uniq(ft.recipient) AS total_sellers,
      uniqIf(ft.recipient, 
        sft.first_transaction_date >= parseDateTime64BestEffort(${startDateStr})
        AND sft.first_transaction_date <= parseDateTime64BestEffort(${endDateStr})
      ) AS new_sellers
    FROM filtered_transfers ft
    LEFT JOIN seller_first_transactions sft ON ft.recipient = sft.recipient
  `;

  const result = await queryRaw(
    sql,
    z.array(
      z.object({
        total_sellers: z.coerce.number(),
        new_sellers: z.coerce.number(),
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
