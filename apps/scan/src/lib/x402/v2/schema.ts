import { z as z3 } from 'zod3';

import { FieldDefSchema } from '../shared';

const ChainIdSchema = z3.union([
  z3.string().regex(/^eip155:\d+$/, 'Invalid EIP-155 chain ID format'),
  z3.enum(['solana', 'solana-devnet']),
]);

const AddressSchema = z3.string();

const outputSchemaV2 = z3.object({
  input: z3.object({
    type: z3.string(),
    method: z3
      .enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'])
      .optional(),
    bodyType: z3
      .enum(['json', 'form-data', 'multipart-form-data', 'text', 'binary'])
      .optional(),
    queryParams: z3.record(FieldDefSchema).optional(),
    bodyFields: z3.record(FieldDefSchema).optional(),
    headerFields: z3.record(FieldDefSchema).optional(),
  }),
  output: z3.record(z3.string(), z3.any()).optional().nullable(),
});

// V2 resource info schema (per x402-rs spec)
// Note: outputSchema is NOT part of official V2 spec, but we accept it for compatibility
const resourceSchemaV2 = z3.object({
  url: z3.string(),
  description: z3.string().optional(),
  mimeType: z3.string().optional(),
  // Extension: outputSchema is not in official spec but some implementations include it
  outputSchema: outputSchemaV2.optional(),
});

export const paymentRequirementsSchemaV2 = z3.object({
  scheme: z3.literal('exact'),
  network: ChainIdSchema,
  amount: z3.string(), // V2 uses 'amount' instead of 'maxAmountRequired'
  payTo: AddressSchema,
  maxTimeoutSeconds: z3.number(),
  asset: z3.string(),
  extra: z3.record(z3.string(), z3.any()).optional(),
});

export const x402ResponseSchemaV2 = z3.object({
  x402Version: z3.literal(2),
  error: z3.string().optional(),
  payer: z3.string().optional(),
  accepts: z3.array(paymentRequirementsSchemaV2).optional(),
  resource: resourceSchemaV2.optional(), // V2 uses "resource" not "resourceInfo"
  // Extension: bazaar schema info
  extensions: z3
    .object({
      bazaar: z3
        .object({
          info: z3.any().optional(),
          schema: z3.any().optional(),
        })
        .optional(),
    })
    .optional(),
});

export type X402ResponseV2 = z3.infer<typeof x402ResponseSchemaV2>;
export type PaymentRequirementsV2 = z3.infer<
  typeof paymentRequirementsSchemaV2
>;
export type OutputSchemaV2 = z3.infer<typeof outputSchemaV2>;
