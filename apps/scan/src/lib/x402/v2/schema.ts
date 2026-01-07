import { z as z3 } from 'zod3';

const ChainIdSchema = z3.union([
  z3.string().regex(/^eip155:\d+$/, 'Invalid EIP-155 chain ID format'),
  z3.enum(['solana', 'solana-devnet']),
]);

const AddressSchema = z3.string();

const FieldDefSchema: z3.ZodTypeAny = z3.lazy(() =>
  z3.preprocess(
    val => (typeof val === 'string' ? { type: val } : val),
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

export const outputSchemaV2 = z3.object({
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

export const resourceInfoSchemaV2 = z3.object({
  resource: z3.string(),
  description: z3.string().optional(),
  mimeType: z3.string().optional(),
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
  resourceInfo: resourceInfoSchemaV2.optional(), // Resource info at top level
});

export type X402ResponseV2 = z3.infer<typeof x402ResponseSchemaV2>;
export type PaymentRequirementsV2 = z3.infer<
  typeof paymentRequirementsSchemaV2
>;
export type ResourceInfoV2 = z3.infer<typeof resourceInfoSchemaV2>;
export type OutputSchemaV2 = z3.infer<typeof outputSchemaV2>;
