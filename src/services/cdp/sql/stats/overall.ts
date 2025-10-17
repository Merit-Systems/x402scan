import z from 'zod';

import { runBaseSqlQuery } from '../query';

import { ethereumAddressSchema } from '@/lib/schemas';
import { baseQuerySchema, formatDateForSql } from '../lib';
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
  const { addresses, startDate, endDate, facilitators, tokens } =
    parseResult.data;
  const outputSchema = z.object({
    total_transactions: z.coerce.number(),
    total_amount: z.coerce.number(),
    unique_buyers: z.coerce.number(),
    unique_sellers: z.coerce.number(),
    latest_block_timestamp: z.coerce.date(),
  });

  const sql = `SELECT
    COUNT(*) AS total_transactions,
    SUM(parameters['value']::UInt256) AS total_amount,
    COUNT(DISTINCT parameters['from']::String) AS unique_buyers,
    COUNT(DISTINCT parameters['to']::String) AS unique_sellers,
    max(block_timestamp) AS latest_block_timestamp
FROM base.events
WHERE event_signature = 'Transfer(address,address,uint256)'
    AND address IN (${tokens.map(t => `'${t}'`).join(', ')})
    AND transaction_from IN (${facilitators.map(f => `'${f}'`).join(', ')})
    ${
      addresses && addresses.length > 0
        ? `AND parameters['to']::String IN (${addresses
            .map(a => `'${a}'`)
            .join(', ')})`
        : ''
    }
    ${
      startDate ? `AND block_timestamp >= '${formatDateForSql(startDate)}'` : ''
    }
    ${endDate ? `AND block_timestamp <= '${formatDateForSql(endDate)}'` : ''}
  `;

  const result = await runBaseSqlQuery(sql, z.array(outputSchema));

  if (!result || result.length === 0) {
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
    total_transactions: data.total_transactions,
    total_amount: data.total_amount,
    unique_buyers: data.unique_buyers,
    unique_sellers: data.unique_sellers,
    latest_block_timestamp: data.latest_block_timestamp,
  };
};

export const getOverallStatistics = createCachedQuery({
  queryFn: getOverallStatisticsUncached,
  cacheKeyPrefix: 'overall-statistics',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['latest_block_timestamp'],

  tags: ['statistics'],
});
