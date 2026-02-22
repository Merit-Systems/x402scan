import z from 'zod';

import { Chain, SUPPORTED_CHAINS } from '@/types/chain';

import { isAddress } from 'viem';
import type { AlgorandAsset, MixedAddress, SolanaAddress } from '@/types/address';
import type { Address } from 'viem';

export const ethereumAddressSchema = z
  .string()
  .refine(isAddress, 'Invalid EVM address')
  .transform(a => a.toLowerCase() as Address);

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

// Algorand address schema (58-char base32, uppercase A-Z and 2-7)
export const algorandAddressSchema = z
  .string()
  .regex(/^[A-Z2-7]{58}$/, 'Invalid Algorand address')
  .transform(address => address as AlgorandAsset);

// Create a mixed address schema
export const mixedAddressSchema = z
  .union([ethereumAddressSchema, solanaAddressSchema, algorandAddressSchema])
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
