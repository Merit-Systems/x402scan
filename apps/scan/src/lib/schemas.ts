import z from 'zod';

import { Chain, SUPPORTED_CHAINS } from '@/types/chain';

import { getAddress, isAddress, type Address } from 'viem';
import type { MixedAddress, SolanaAddress } from '@/types/address';

export const ethereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address')
  .transform(address => address.toLowerCase() as Address);

export const sortingSchema = (sortIds: string[] | readonly string[]) =>
  z.object({
    id: z.enum(sortIds),
    desc: z.boolean(),
  });
// Add a Solana address schema
export const solanaAddressSchema = z
  .string()
  .regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, 'Invalid Solana address')
  .transform(address => address as SolanaAddress);

// Create a mixed address schema
export const mixedAddressSchema = z
  .union([ethereumAddressSchema, solanaAddressSchema])
  .transform(address => address as MixedAddress);

export const chainSchema = z.enum(Chain);
export const optionalChainSchema = chainSchema.optional();
export const supportedChainSchema = z.enum(SUPPORTED_CHAINS);
export const optionalSupportedChainSchema = supportedChainSchema.optional();

export const timePeriodSchema = z.number().nonnegative();

export const timeframeSchema = z.union([
  timePeriodSchema,
  z.object({
    period: timePeriodSchema,
    offset: timePeriodSchema.optional(),
  }),
]);

export const sendUsdcQueryParamsSchema = z.object({
  amount: z.coerce.number(),
  address: mixedAddressSchema,
  chain: supportedChainSchema,
});

export const evmAddressSchema = z
  .string()
  .refine(isAddress, 'Invalid EVM address')
  .transform(a => getAddress(a));
