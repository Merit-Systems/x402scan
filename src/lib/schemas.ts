import z from 'zod';

import type { Address, Hash } from 'viem';
import type { MixedAddress, SolanaAddress } from '@/types/address';
import { Chain } from '@/types/chain';

export const ethereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address')
  .transform(address => address.toLowerCase() as Address);

export const ethereumHashSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash')
  .transform(hash => hash.toLowerCase() as Hash);

export const sortingSchema = (sortIds: string[] | readonly string[]) =>
  z.object({
    id: z.enum(sortIds),
    desc: z.boolean(),
  });
// Add a Solana address schema
const solanaAddressSchema = z
  .string()
  .regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, 'Invalid Solana address')
  .transform(address => address as SolanaAddress);

// Create a mixed address schema
export const mixedAddressSchema = z
  .union([ethereumAddressSchema, solanaAddressSchema])
  .transform(address => address as MixedAddress);

export const chainSchema = z.enum(Chain);
export const optionalChainSchema = chainSchema.optional();
