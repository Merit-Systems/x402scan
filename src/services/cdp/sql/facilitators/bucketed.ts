import z from 'zod';
import { subMonths } from 'date-fns';

import { runBaseSqlQuery } from '../query';
import { baseQuerySchema, formatDateForSql } from '../lib';
import { createCachedArrayQuery, createStandardCacheKey } from '@/lib/cache';
import { facilitators } from '@/lib/facilitators';
import {
  usdcAmountSchema,
  countValueSchema,
  type USDCAmount,
  type CountValue,
} from '@/lib/cdp/numeric-types';

export const bucketedStatisticsInputSchema = baseQuerySchema.extend({
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

const getBucketedFacilitatorsStatisticsUncached = async (
  input: z.input<typeof bucketedStatisticsInputSchema>
) => {
  const parseResult = bucketedStatisticsInputSchema.safeParse(input);
  if (!parseResult.success) {
    throw new Error('Invalid input: ' + parseResult.error.message);
  }
  const { startDate, endDate, numBuckets, tokens } = parseResult.data;
  const outputSchema = z.object({
    bucket_start: z.coerce.date(),
    total_transactions: countValueSchema,
    total_amount: usdcAmountSchema,
    unique_buyers: countValueSchema,
    unique_sellers: countValueSchema,
    facilitator_name: z.enum(['Unknown', ...facilitators.map(f => f.name)]),
  });

  // Calculate bucket size in seconds for consistent alignment
  const timeRangeMs = endDate.getTime() - startDate.getTime();
  const bucketSizeMs = Math.floor(timeRangeMs / numBuckets);
  const bucketSizeSeconds = Math.max(1, Math.floor(bucketSizeMs / 1000)); // Ensure at least 1 second

  // Simple query to get actual data - we'll add zeros in TypeScript
  const sql = `SELECT
    toDateTime(toUInt32(toUnixTimestamp(block_timestamp) / ${bucketSizeSeconds}) * ${bucketSizeSeconds}) AS bucket_start,
    COUNT(*) AS total_transactions,
    SUM(parameters['value']::UInt256) AS total_amount,
    COUNT(DISTINCT parameters['from']::String) AS unique_buyers,
    COUNT(DISTINCT parameters['to']::String) AS unique_sellers,
    CASE
    ${facilitators
      .map(
        f =>
          `WHEN transaction_from IN (${f.addresses
            .map(a => `'${a}'`)
            .join(', ')}) THEN '${f.name}'`
      )
      .join('\n        ')}
    ELSE 'Unknown'
    END AS facilitator_name
FROM base.events
WHERE 
    event_signature = 'Transfer(address,address,uint256)'
    AND parameters['value']::UInt256 < 1000000000
    AND address IN (${tokens.map(t => `'${t}'`).join(', ')})
    AND transaction_from IN (${facilitators
      .flatMap(f => f.addresses)
      .map(a => `'${a}'`)
      .join(', ')})
    ${
      startDate ? `AND block_timestamp >= '${formatDateForSql(startDate)}'` : ''
    }
    ${endDate ? `AND block_timestamp <= '${formatDateForSql(endDate)}'` : ''}
GROUP BY 
  CASE
    ${facilitators
      .map(
        f =>
          `WHEN transaction_from IN (${f.addresses
            .map(a => `'${a}'`)
            .join(', ')}) THEN '${f.name}'`
      )
      .join('\n        ')}
    ELSE 'Unknown'
  END, 
  bucket_start
ORDER BY bucket_start ASC;
  `;

  const result = await runBaseSqlQuery(sql, z.array(outputSchema));

  if (!result) {
    return [];
  }

  // Collapse the result array so that each item is grouped by bucket_start, and for each bucket_start,
  // there is a sub-object keyed by facilitator_name (or id if available), containing the statistics for that facilitator.
  // The output will be an array of objects, each with a bucket_start and a facilitators object.

  const collapsed = result.reduce(
    (acc, item) => {
      const { bucket_start, facilitator_name, ...rest } = item;
      let bucket = acc.find(
        b => b.bucket_start.getTime() === bucket_start.getTime()
      );
      if (!bucket) {
        bucket = { bucket_start, facilitators: {} };
        acc.push(bucket);
      }
      // Use facilitator_name as the key; if you have an id, replace with id
      bucket.facilitators[facilitator_name] = rest;
      return acc;
    },
    [] as {
      bucket_start: Date;
      facilitators: Record<
        string,
        {
          total_transactions: CountValue;
          total_amount: USDCAmount;
          unique_buyers: CountValue;
          unique_sellers: CountValue;
        }
      >;
    }[]
  );

  return collapsed;
};

export const getBucketedFacilitatorsStatistics = createCachedArrayQuery({
  queryFn: getBucketedFacilitatorsStatisticsUncached,
  cacheKeyPrefix: 'bucketed-facilitators-statistics',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['bucket_start'],

  tags: ['facilitators-statistics'],
});
