import z from 'zod';

import { baseQuerySchema } from '../schemas';
import { createCachedQuery, createStandardCacheKey } from '@/lib/cache';
import { queryRaw } from '@/services/transfers/client';
import { transfersWhereClause } from '../query-utils';

export const overallStatisticsInputSchema = baseQuerySchema;

const getOverallStatisticsUncached = async (
  input: z.infer<typeof overallStatisticsInputSchema>
) => {
  const whereClause = transfersWhereClause(input);

  const sql = `
    SELECT 
      COUNT(*) AS total_transactions,
      COALESCE(SUM(amount), 0) AS total_amount,
      uniq(sender) AS unique_buyers,
      uniq(recipient) AS unique_sellers,
      MAX(block_timestamp) AS latest_block_timestamp
    FROM public_TransferEvent
    ${whereClause}
  `;

  const result = await queryRaw(
    sql,
    z.array(
      z.object({
        total_transactions: z.coerce.number(),
        total_amount: z.number(),
        unique_buyers: z.coerce.number(),
        unique_sellers: z.coerce.number(),
        latest_block_timestamp: z.coerce.date().nullable(),
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

export const getOverallStatistics = createCachedQuery({
  queryFn: getOverallStatisticsUncached,
  cacheKeyPrefix: 'overall-statistics',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['latest_block_timestamp'],
  tags: ['statistics'],
});
