import z from "zod";

import { Chain, SUPPORTED_CHAINS } from "@/types/chain";

import { isAddress } from "viem";
import type { SolanaAddress } from "@/types/address";
import type { Address } from "viem";

export const ethereumAddressSchema = z
  .string()
  .transform((address) => address.toLowerCase())
  .pipe(
    z.custom<Address>((address) => {
      const parsed = z.string().safeParse(address);
      return parsed.success && isAddress(parsed.data, { strict: false });
    }, "Invalid EVM address")
  );

export const sortingSchema = (sortIds: string[] | readonly string[]) =>
  z.object({
    id: z.enum(sortIds),
    desc: z.boolean(),
  });
// Add a Solana address schema
export const solanaAddressSchema = z
  .string()
  .regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, "Invalid Solana address")
  .pipe(z.custom<SolanaAddress>());

// Create a mixed address schema
export const mixedAddressSchema = z
  .union([ethereumAddressSchema, solanaAddressSchema])
  .transform((address) => address);

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

export const sendUsdcBodySchema = z.object({
  amount: z.number(),
  address: mixedAddressSchema,
  chain: supportedChainSchema,
});
