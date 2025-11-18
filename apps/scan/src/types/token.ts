import z from 'zod';

import { chainSchema, mixedAddressSchema } from '@/lib/schemas';

export const tokenSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  icon: z.string(),
  address: mixedAddressSchema,
  decimals: z.int().nonnegative(),
  chain: chainSchema,
});

export type Token = z.infer<typeof tokenSchema>;
