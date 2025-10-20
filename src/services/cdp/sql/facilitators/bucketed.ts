import z from 'zod';
import { subMonths } from 'date-fns';

import { baseQuerySchema } from '../lib';
import { createCachedArrayQuery, createStandardCacheKey } from '@/lib/cache';
import { facilitators } from '@/lib/facilitators';
import { getBucketedFacilitatorsStats } from '@/services/db/transfers';

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

  const result = await getBucketedFacilitatorsStats({
    tokenAddresses: tokens,
    startDate,
    endDate,
    numBuckets,
  });

  // Map facilitator IDs to names
  return result.map(bucket => {
    const facilitatorsByName: Record<string, {
      total_transactions: number;
      total_amount: number;
      unique_buyers: number;
      unique_sellers: number;
    }> = {};

    for (const [facilitatorId, stats] of Object.entries(bucket.facilitators)) {
      const facilitator = facilitators.find(f => 
        f.addresses.some(addr => addr.toLowerCase() === facilitatorId.toLowerCase())
      );
      const facilitatorName = facilitator?.name ?? 'Unknown';
      facilitatorsByName[facilitatorName] = stats;
    }

    return {
      bucket_start: bucket.bucket_start,
      facilitators: facilitatorsByName,
    };
  });
};

export const getBucketedFacilitatorsStatistics = createCachedArrayQuery({
  queryFn: getBucketedFacilitatorsStatisticsUncached,
  cacheKeyPrefix: 'bucketed-facilitators-statistics',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['bucket_start'],

  tags: ['facilitators-statistics'],
});
