import {
  ChainIdToNetwork,
  HTTPRequestStructureSchema,
  PaymentRequirementsSchema,
  x402ResponseSchema,
} from 'x402/types';
import { z as z3 } from 'zod3';

const FieldDefSchema: z3.ZodTypeAny = z3.lazy(() =>
  z3.preprocess(
    val => {
      // Convert string shorthand to object
      if (typeof val === 'string') {
        return { type: val };
      }
      return val;
    },
    z3.object({
      type: z3.string().optional(),
      required: z3.union([z3.boolean(), z3.array(z3.string())]).optional(),
      description: z3.string().optional(),
      enum: z3.array(z3.string()).optional(),
      properties: z3.record(z3.lazy(() => FieldDefSchema)).optional(),
      items: z3.lazy(() => FieldDefSchema).optional(),
    })
  )
);

export const outputSchemaV1 = z3.object({
  input: HTTPRequestStructureSchema.omit({
    queryParams: true,
    bodyFields: true,
    headerFields: true,
  }).extend({
    headerFields: z3.record(FieldDefSchema).optional(),
    queryParams: z3.record(FieldDefSchema).optional(),
    bodyFields: z3.record(FieldDefSchema).optional(),
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

export const paymentRequirementsSchemaV1 = PaymentRequirementsSchema.extend({
  network: networkSchemaV1,
  outputSchema: outputSchemaV1.optional(),
});

export const x402ResponseSchemaV1 = x402ResponseSchema
  .omit({ error: true, accepts: true })
  .extend({
    x402Version: z3.literal(1).optional(), // Optional for backward compat
    error: z3.string().optional(),
    accepts: z3.array(paymentRequirementsSchemaV1).optional(),
  });

export type X402ResponseV1 = z3.infer<typeof x402ResponseSchemaV1>;
export type PaymentRequirementsV1 = z3.infer<
  typeof paymentRequirementsSchemaV1
>;
