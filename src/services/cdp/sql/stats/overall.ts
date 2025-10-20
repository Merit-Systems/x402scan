import z from 'zod';

import { ethereumAddressSchema } from '@/lib/schemas';
import { baseQuerySchema } from '../lib';
import { createCachedQuery, createStandardCacheKey } from '@/lib/cache';
import { getOverallStats } from '@/services/db/transfers';

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

  return await getOverallStats({
    facilitatorIds: facilitators,
    tokenAddresses: tokens,
    recipientAddresses: addresses,
    startDate,
    endDate,
  });
};

export const getOverallStatistics = createCachedQuery({
  queryFn: getOverallStatisticsUncached,
  cacheKeyPrefix: 'overall-statistics',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['latest_block_timestamp'],

  tags: ['statistics'],
});
