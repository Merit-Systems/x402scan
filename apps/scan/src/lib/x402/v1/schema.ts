import { ChainIdToNetwork } from 'x402/types';
import { z as z3 } from 'zod3';

import { FieldDefSchema, basePaymentRequirementsSchema } from '../shared';

export const outputSchemaV1 = z3.object({
  input: z3.object({
    type: z3.literal('http'),
    method: z3.enum(['GET', 'POST']),
    bodyType: z3
      .enum(['json', 'form-data', 'multipart-form-data', 'text', 'binary'])
      .optional(),
    queryParams: z3.record(FieldDefSchema).optional(),
    bodyFields: z3.record(FieldDefSchema).optional(),
    headerFields: z3.record(FieldDefSchema).optional(),
  }),
  output: z3.record(z3.string(), z3.any()).optional().nullable(),
});

const namedNetwork = z3.enum([
  'base-sepolia',
  'avalanche-fuji',
  'base',
  'sei',
  'sei-testnet',
  'avalanche',
  'iotex',
  'solana-devnet',
  'solana',
]);

const networkSchemaV1 = z3.union([
  namedNetwork,
  z3
    .string()
    .refine(
      v =>
        v.startsWith('eip155:') && !!ChainIdToNetwork[Number(v.split(':')[1])],
      { message: 'Invalid network' }
    )
    .transform(v => ChainIdToNetwork[Number(v.split(':')[1])]),
]);

export const paymentRequirementsSchemaV1 = basePaymentRequirementsSchema.extend({
  network: networkSchemaV1,
  maxAmountRequired: z3.string(),
  resource: z3.string(),
  description: z3.string(),
  mimeType: z3.string(),
  outputSchema: outputSchemaV1.optional(),
});

export const x402ResponseSchemaV1 = z3.object({
  x402Version: z3.literal(1).default(1),
  error: z3.string().optional(),
  accepts: z3.array(paymentRequirementsSchemaV1).optional(),
  payer: z3.string().optional(),
});

export type X402ResponseV1 = z3.infer<typeof x402ResponseSchemaV1>;
export type PaymentRequirementsV1 = z3.infer<
  typeof paymentRequirementsSchemaV1
>;
export type OutputSchemaV1 = z3.infer<typeof outputSchemaV1>;
