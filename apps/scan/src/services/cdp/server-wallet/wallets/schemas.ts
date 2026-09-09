import z from "zod";

import { mixedAddressSchema } from "@/lib/schemas";
import { tokenSchema } from "@/types/token";

export const getTokenBalanceSchema = z.object({
  token: tokenSchema,
});

export const sendTokensSchema = z.object({
  token: tokenSchema,
  amount: z.number(),
  address: mixedAddressSchema,
});
