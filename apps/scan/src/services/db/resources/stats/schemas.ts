import z from 'zod';
import { subMonths } from 'date-fns';

export const resourceBucketedQuerySchema = z.object({
  startDate: z.date().default(() => subMonths(new Date(), 1)),
  endDate: z.date().default(() => new Date()),
  numBuckets: z.number().default(48),
  tagIds: z.array(z.string()).optional(),
});
