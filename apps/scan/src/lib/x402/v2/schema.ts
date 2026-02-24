import type { Network, PaymentRequirements } from '@x402/core/types';
import { z as z3 } from 'zod3';

// NOTE(shafu): this was changed in V2, it does not support network names like base
const ChainIdSchema = z3.custom<Network>(
  val => typeof val === 'string' && /^(eip155:\d+|solana:.+)$/.test(val),
  { message: 'Invalid CAIP-2 network format' }
);

const resourceSchemaV2 = z3.object({
  url: z3.string(),
  description: z3.string(),
  mimeType: z3.string().optional(),
});

export const paymentRequirementsSchemaV2 = z3.object({
  scheme: z3.string(),
  network: ChainIdSchema,
  asset: z3.string(),
  amount: z3.string(),
  payTo: z3.string(),
  maxTimeoutSeconds: z3.number(),
  extra: z3.record(z3.string(), z3.any()), // Using any() for Prisma JSON compatibility
});

const extensionsSchemaV2 = z3.object({
  bazaar: z3
    .object({
      info: z3
        .object({
          input: z3.any(),
          output: z3.any().optional(),
        })
        .optional(),
      schema: z3.any().optional(), // JSON Schema format
    })
    .optional(),
});

export const x402ResponseSchemaV2 = z3.object({
  x402Version: z3.literal(2),
  error: z3.string().optional(),
  accepts: z3.array(paymentRequirementsSchemaV2).optional(),
  resource: resourceSchemaV2.optional(),
  extensions: extensionsSchemaV2.optional(),
});

export type X402ResponseV2 = z3.infer<typeof x402ResponseSchemaV2>;
export type PaymentRequirementsV2 = PaymentRequirements;
