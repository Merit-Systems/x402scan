import { chainSchema, mixedAddressSchema } from '@/lib/schemas';
import { subMonths } from 'date-fns';
import z from 'zod';

const addressesSchema = z.object({
  include: z.array(mixedAddressSchema).optional(),
  exclude: z.array(mixedAddressSchema).optional(),
});

export const baseQuerySchema = z.object({
  chain: chainSchema.optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
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

export const baseBucketedQuerySchema = baseQuerySchema
  .omit({ startDate: true, endDate: true })
  .extend({
    startDate: z.date().default(() => subMonths(new Date(), 1)),
    endDate: z.date().default(() => new Date()),
    numBuckets: z.number().default(48),
  });
