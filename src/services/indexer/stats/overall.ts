import z from 'zod';
import { queryIndexerDb } from '../client';
import { ethereumAddressSchema } from '@/lib/schemas';
import { baseQuerySchema } from '../lib';
import { createCachedQuery, createStandardCacheKey } from '@/lib/cache';

export const overallStatisticsInputSchema = baseQuerySchema.extend({
  addresses: z.array(ethereumAddressSchema).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

const getOverallStatisticsUncached = async (
  input: z.input<typeof overallStatisticsInputSchema>
) => {
  const parseResult = overallStatisticsInputSchema.safeParse(input);
  if (!parseResult.success) {
    throw new Error('Invalid input: ' + parseResult.error.message);
  }
  const { addresses, startDate, endDate, facilitators, tokens, chain } = parseResult.data;

  let paramIndex = 1;
  const params: unknown[] = [tokens, facilitators, chain];
  
  let whereClause = `
    WHERE address = ANY($${paramIndex++})
      AND transaction_from = ANY($${paramIndex++})
      AND chain = $${paramIndex++}
  `;

  if (addresses) {
    whereClause += ` AND recipient = ANY($${paramIndex++})`;
    params.push(addresses);
  }
  
  if (startDate) {
    whereClause += ` AND block_timestamp >= $${paramIndex++}`;
    params.push(startDate);
  }
  
  if (endDate) {
    whereClause += ` AND block_timestamp <= $${paramIndex++}`;
    params.push(endDate);
  }

  const sql = `
    SELECT
      COUNT(*)::bigint AS total_transactions,
      COALESCE(SUM(amount::numeric), 0)::bigint AS total_amount,
      COUNT(DISTINCT sender)::bigint AS unique_buyers,
      COUNT(DISTINCT recipient)::bigint AS unique_sellers,
      MAX(block_timestamp) AS latest_block_timestamp
    FROM "TransferEvent"
    ${whereClause}
  `;

  const result = await queryIndexerDb<{
    total_transactions: string;
    total_amount: string;
    unique_buyers: string;
    unique_sellers: string;
    latest_block_timestamp: Date | null;
  }>(sql, params);

  if (!result || result.length === 0 || !result[0]) {
    return {
      total_transactions: 0,
      total_amount: 0,
      unique_buyers: 0,
      unique_sellers: 0,
      latest_block_timestamp: new Date(),
    };
  }

  const data = result[0];
  return {
    total_transactions: Number(data.total_transactions),
    total_amount: Number(data.total_amount),
    unique_buyers: Number(data.unique_buyers),
    unique_sellers: Number(data.unique_sellers),
    latest_block_timestamp: data.latest_block_timestamp || new Date(),
  };
};

export const getOverallStatistics = createCachedQuery({
  queryFn: getOverallStatisticsUncached,
  cacheKeyPrefix: 'overall-statistics',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['latest_block_timestamp'],
  tags: ['statistics'],
});

