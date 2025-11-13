import z from 'zod';
import { timePeriodSchema } from '@/lib/schemas';

export const resourceBucketedQuerySchema = z.object({
  timeframe: timePeriodSchema,
  numBuckets: z.number().default(48),
  tagIds: z.array(z.string()).optional(),
});
