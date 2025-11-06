import z from 'zod';

import { chainSchema, mixedAddressSchema } from '@/lib/schemas';
import { ActivityTimeframe } from '@/types/timeframes';
import { timeframeSchema } from '@/lib/schemas';

const addressArray = z
  .array(mixedAddressSchema)
  .transform(addresses => addresses.toSorted((a, b) => a.localeCompare(b)));

const addressesSchema = z.object({
  include: addressArray.optional(),
  exclude: addressArray.optional(),
});

export const baseQuerySchema = z.object({
  chain: chainSchema.optional(),
  timeframe: timeframeSchema,
  offset: z.enum(ActivityTimeframe).optional(),
  senders: addressesSchema.optional(),
  recipients: addressesSchema.optional(),
  facilitatorIds: z.array(z.string()).optional(),
});

export const baseListQuerySchema = <T extends readonly string[]>({
  sortIds,
  defaultSortId,
}: {
  sortIds: T;
  defaultSortId: T[number];
}) =>
  baseQuerySchema.extend({
    sorting: z
      .object({
        id: z.enum(sortIds),
        desc: z.boolean(),
      })
      .default({
        id: defaultSortId,
        desc: true,
      }),
  });

export const baseBucketedQuerySchema = baseQuerySchema.extend({
  numBuckets: z.number().default(48),
});
