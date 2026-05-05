import {
  PaymentRequirementsV2Schema,
  ResourceInfoSchema,
} from '@x402/core/schemas';
import { z as z3 } from 'zod3';

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
  error: z3.string().nullish(),
  accepts: z3.array(PaymentRequirementsV2Schema).optional(),
  resource: ResourceInfoSchema.optional(),
  extensions: extensionsSchemaV2.nullish(),
});

export type X402ResponseV2 = z3.infer<typeof x402ResponseSchemaV2>;
