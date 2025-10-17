import z from 'zod';
import { subMonths } from 'date-fns';

import { runBaseSqlQuery } from '../query';
import { baseQuerySchema, formatDateForSql } from '../lib';
import { ethereumAddressSchema } from '@/lib/schemas';
import { createCachedArrayQuery, createStandardCacheKey } from '@/lib/cache';

export const bucketedStatisticsInputSchema = baseQuerySchema.extend({
  addresses: z.array(ethereumAddressSchema).optional(),
  startDate: z
    .date()
    .optional()
    .default(() => subMonths(new Date(), 1)),
  endDate: z
    .date()
    .optional()
    .default(() => new Date()),
  numBuckets: z.number().optional().default(48),
});

const getBucketedStatisticsUncached = async (
  input: z.input<typeof bucketedStatisticsInputSchema>
) => {
  const parseResult = bucketedStatisticsInputSchema.safeParse(input);
  if (!parseResult.success) {
    throw new Error('Invalid input: ' + parseResult.error.message);
  }
  const { addresses, startDate, endDate, numBuckets, facilitators, tokens } =
    parseResult.data;
  const outputSchema = z.object({
    bucket_start: z.coerce.date(),
    total_transactions: z.coerce.number(),
    total_amount: z.coerce.number(),
    unique_buyers: z.coerce.number(),
    unique_sellers: z.coerce.number(),
  });

  // Calculate bucket size in seconds for consistent alignment
  const timeRangeMs = endDate.getTime() - startDate.getTime();
  const bucketSizeMs = Math.floor(timeRangeMs / numBuckets);
  const bucketSizeSeconds = Math.max(1, Math.floor(bucketSizeMs / 1000)); // Ensure at least 1 second

  // Calculate the first bucket start time aligned to the bucket size
  const startTimestamp = Math.floor(startDate.getTime() / 1000);
  const firstBucketStartTimestamp =
    Math.floor(startTimestamp / bucketSizeSeconds) * bucketSizeSeconds;

  // Simple query to get actual data - we'll add zeros in TypeScript
  const sql = `SELECT
    toDateTime(toUInt32(toUnixTimestamp(block_timestamp) / ${bucketSizeSeconds}) * ${bucketSizeSeconds}) AS bucket_start,
    COUNT(*) AS total_transactions,
    SUM(parameters['value']::UInt256) AS total_amount,
    COUNT(DISTINCT parameters['from']::String) AS unique_buyers,
    COUNT(DISTINCT parameters['to']::String) AS unique_sellers
FROM base.events
WHERE event_signature = 'Transfer(address,address,uint256)'
    AND address IN (${tokens.map(t => `'${t}'`).join(', ')})
    AND transaction_from IN (${facilitators.map(f => `'${f}'`).join(', ')})
    AND parameters['value']::UInt256 < 1000000000
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
GROUP BY bucket_start
ORDER BY bucket_start ASC;
  `;

  const result = await runBaseSqlQuery(sql, z.array(outputSchema));

  if (!result) {
    return [];
  }

  // Generate complete time series with zero values for missing periods
  const completeTimeSeries = [];
  const dataMap = new Map(
    result.map(item => [
      item.bucket_start.getTime(),
      {
        bucket_start: item.bucket_start,
        total_transactions: item.total_transactions,
        total_amount: item.total_amount,
        unique_buyers: item.unique_buyers,
        unique_sellers: item.unique_sellers,
      },
    ])
  );

  // Generate all expected time buckets using consistent bucket alignment
  for (let i = 0; i < numBuckets; i++) {
    // Calculate bucket start time using the same logic as SQL
    const bucketStartTimestamp =
      firstBucketStartTimestamp + i * bucketSizeSeconds;
    const bucketStart = new Date(bucketStartTimestamp * 1000);

    // Check if we have data for this bucket using the exact timestamp
    const bucketKey = bucketStart.getTime();
    const existingData = dataMap.get(bucketKey);

    if (existingData) {
      completeTimeSeries.push(existingData);
    } else {
      // Add zero values for missing periods
      completeTimeSeries.push({
        bucket_start: bucketStart,
        total_transactions: 0,
        total_amount: 0,
        unique_buyers: 0,
        unique_sellers: 0,
      });
    }
  }

  return completeTimeSeries;
};

export const getBucketedStatistics = createCachedArrayQuery({
  queryFn: getBucketedStatisticsUncached,
  cacheKeyPrefix: 'bucketed-statistics',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['bucket_start'],

  tags: ['statistics'],
});
