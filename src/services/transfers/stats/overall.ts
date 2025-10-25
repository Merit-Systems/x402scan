import z from 'zod';
import { Prisma } from '@prisma/client';

import { baseQuerySchema } from '../schemas';
import { createCachedQuery, createStandardCacheKey } from '@/lib/cache';
import { queryRaw } from '@/services/transfers/client';
import { transfersWhereClause } from '../query-utils';

export const overallStatisticsInputSchema = baseQuerySchema;

const getOverallStatisticsUncached = async (
  input: z.infer<typeof overallStatisticsInputSchema>
) => {
  const sql = Prisma.sql`
    SELECT 
      COUNT(*)::int AS total_transactions,
      COALESCE(SUM(t.amount), 0)::float AS total_amount,
      COUNT(DISTINCT t.sender)::int AS unique_buyers,
      COUNT(DISTINCT t.recipient)::int AS unique_sellers,
      MAX(t.block_timestamp) AS latest_block_timestamp
    FROM "TransferEvent" t
    ${transfersWhereClause(input)}
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

export const getOverallStatistics = createCachedQuery({
  queryFn: getOverallStatisticsUncached,
  cacheKeyPrefix: 'overall-statistics',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['latest_block_timestamp'],
  tags: ['statistics'],
});
