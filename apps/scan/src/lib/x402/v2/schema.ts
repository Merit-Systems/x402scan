import { z as z3 } from 'zod3';

import { outputSchemaV1 } from '../v1';

// NOTE(shafu): this was changed in V2, it does not support network names like base
const ChainIdSchema = z3.union([
  z3.string().regex(/^eip155:\d+$/, 'Invalid EIP-155 chain ID format'),
  z3.enum(['solana', 'solana-devnet']),
]);

// Note(shafu): outputSchema is NOT part of official V2 spec, but we accept it for compatibility
const resourceSchemaV2 = z3.object({
  url: z3.string(),
  description: z3.string().optional(),
  mimeType: z3.string().optional(),
  outputSchema: outputSchemaV1.optional(), // NOTE(shafu): we use v1 outputSchema for compatibility
});

export const paymentRequirementsSchemaV2 = z3.object({
  scheme: z3.literal('exact'),
  network: ChainIdSchema,
  amount: z3.string(), // V2 uses 'amount' instead of 'maxAmountRequired'
  payTo: z3.string(),
  maxTimeoutSeconds: z3.number(),
  asset: z3.string(),
  extra: z3.record(z3.string(), z3.any()).optional(),
});

export const x402ResponseSchemaV2 = z3.object({
  x402Version: z3.literal(2),
  error: z3.string().optional(),
  payer: z3.string().optional(),
  accepts: z3.array(paymentRequirementsSchemaV2).optional(),
  resource: resourceSchemaV2.optional(),
});

export type X402ResponseV2 = z3.infer<typeof x402ResponseSchemaV2>;
export type PaymentRequirementsV2 = z3.infer<
  typeof paymentRequirementsSchemaV2
>;
