import { facilitators } from '@/lib/facilitators';
import { ethereumAddressSchema } from '@/lib/schemas';
import { USDC_ADDRESS } from '@/lib/utils';
import z from 'zod';

export const baseQuerySchema = z.object({
  facilitators: z
    .array(ethereumAddressSchema)
    .min(1)
    .default(facilitators.flatMap(f => f.addresses)),
  tokens: z.array(ethereumAddressSchema).min(1).default([USDC_ADDRESS]),
  chain: z.enum(['base', 'solana', 'polygon']).default('base'),
});

export const sortingSchema = (sortIds: string[] | readonly string[]) =>
  z.object({
    id: z.enum(sortIds as [string, ...string[]]),
    desc: z.boolean(),
  });