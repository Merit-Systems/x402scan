import z from 'zod';
import { subMonths } from 'date-fns';
import { queryIndexerDb } from '../client';
import { baseQuerySchema } from '../lib';
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
  const { addresses, startDate, endDate, numBuckets, facilitators, tokens, chain } =
    parseResult.data;

  const timeRangeMs = endDate.getTime() - startDate.getTime();
  const bucketSizeMs = Math.floor(timeRangeMs / numBuckets);
  const bucketSizeSeconds = Math.max(1, Math.floor(bucketSizeMs / 1000));

  const startTimestamp = Math.floor(startDate.getTime() / 1000);
  const firstBucketStartTimestamp =
    Math.floor(startTimestamp / bucketSizeSeconds) * bucketSizeSeconds;

  let paramIndex = 1;
  const params: unknown[] = [bucketSizeSeconds, tokens, facilitators, chain];
  
  let whereClause = `
    WHERE address = ANY($${paramIndex + 1})
      AND transaction_from = ANY($${paramIndex + 2})
      AND chain = $${paramIndex + 3}
      AND amount::numeric < 1000000000
  `;
  paramIndex += 3;

  if (addresses && addresses.length > 0) {
    whereClause += ` AND recipient = ANY($${paramIndex + 1})`;
    params.push(addresses);
    paramIndex++;
  }
  
  if (startDate) {
    whereClause += ` AND block_timestamp >= $${paramIndex + 1}`;
    params.push(startDate);
    paramIndex++;
  }
  
  if (endDate) {
    whereClause += ` AND block_timestamp <= $${paramIndex + 1}`;
    params.push(endDate);
  }

  const sql = `
    SELECT
      TO_TIMESTAMP(FLOOR(EXTRACT(EPOCH FROM block_timestamp) / $1) * $1) AS bucket_start,
      COUNT(*)::bigint AS total_transactions,
      COALESCE(SUM(amount::numeric), 0)::bigint AS total_amount,
      COUNT(DISTINCT sender)::bigint AS unique_buyers,
      COUNT(DISTINCT recipient)::bigint AS unique_sellers
    FROM "TransferEvent"
    ${whereClause}
    GROUP BY bucket_start
    ORDER BY bucket_start ASC
  `;

  const result = await queryIndexerDb<{
    bucket_start: Date;
    total_transactions: string;
    total_amount: string;
    unique_buyers: string;
    unique_sellers: string;
  }>(sql, params);

  if (!result) {
    return [];
  }

  // Generate complete time series with zero values for missing periods
  const dataMap = new Map(
    result.map(item => [
      item.bucket_start.getTime(),
      {
        bucket_start: item.bucket_start,
        total_transactions: Number(item.total_transactions),
        total_amount: Number(item.total_amount),
        unique_buyers: Number(item.unique_buyers),
        unique_sellers: Number(item.unique_sellers),
      },
    ])
  );

  const completeTimeSeries = [];
  for (let i = 0; i < numBuckets; i++) {
    const bucketStartTimestamp = firstBucketStartTimestamp + i * bucketSizeSeconds;
    const bucketStart = new Date(bucketStartTimestamp * 1000);
    const bucketKey = bucketStart.getTime();
    const existingData = dataMap.get(bucketKey);

    if (existingData) {
      completeTimeSeries.push(existingData);
    } else {
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

