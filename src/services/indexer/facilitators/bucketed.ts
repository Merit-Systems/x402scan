import z from 'zod';
import { subMonths } from 'date-fns';
import { queryIndexerDb } from '../client';
import { baseQuerySchema } from '../lib';
import { createCachedArrayQuery, createStandardCacheKey } from '@/lib/cache';
import { facilitators } from '@/lib/facilitators';

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
  const { startDate, endDate, numBuckets, tokens, chain } = parseResult.data;

  const timeRangeMs = endDate.getTime() - startDate.getTime();
  const bucketSizeMs = Math.floor(timeRangeMs / numBuckets);
  const bucketSizeSeconds = Math.max(1, Math.floor(bucketSizeMs / 1000));

  const facilitatorCases = facilitators
    .map(
      f =>
        `WHEN transaction_from = ANY(ARRAY[${f.addresses.map(a => `'${a}'`).join(', ')}]) THEN '${f.name}'`
    )
    .join('\n        ');

  const facilitatorAddresses = facilitators.flatMap(f => f.addresses);

  let paramIndex = 1;
  const params: unknown[] = [bucketSizeSeconds, tokens, chain, facilitatorAddresses];
  
  let whereClause = `
    WHERE address = ANY($${paramIndex + 1})
      AND chain = $${paramIndex + 2}
      AND amount::numeric < 1000000000
      AND transaction_from = ANY($${paramIndex + 3})
  `;
  paramIndex += 3;

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
      SUM(amount::numeric)::bigint AS total_amount,
      COUNT(DISTINCT sender)::bigint AS unique_buyers,
      COUNT(DISTINCT recipient)::bigint AS unique_sellers,
      CASE
        ${facilitatorCases}
        ELSE 'Unknown'
      END AS facilitator_name
    FROM "TransferEvent"
    ${whereClause}
    GROUP BY 
      CASE
        ${facilitatorCases}
        ELSE 'Unknown'
      END,
      bucket_start
    ORDER BY bucket_start ASC
  `;

  const result = await queryIndexerDb<{
    bucket_start: Date;
    total_transactions: string;
    total_amount: string;
    unique_buyers: string;
    unique_sellers: string;
    facilitator_name: string;
  }>(sql, params);

  if (!result) {
    return [];
  }

  // Collapse results by bucket_start
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
      bucket.facilitators[facilitator_name] = {
        total_transactions: Number(rest.total_transactions),
        total_amount: Number(rest.total_amount),
        unique_buyers: Number(rest.unique_buyers),
        unique_sellers: Number(rest.unique_sellers),
      };
      return acc;
    },
    [] as {
      bucket_start: Date;
      facilitators: Record<
        string,
        {
          total_transactions: number;
          total_amount: number;
          unique_buyers: number;
          unique_sellers: number;
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

