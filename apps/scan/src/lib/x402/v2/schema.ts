import {
  PaymentRequirementsV2Schema,
  ResourceInfoSchema,
} from '@x402/core/schemas';
import { z as z3 } from 'zod3';

import { jsonValueSchema3 } from '../shared';

/**
 * A JSON-Schema-shaped node as attached by bazaar discovery extensions.
 * The structural keys we consume are typed; all other keys are preserved
 * as raw JSON at runtime via `catchall`. A `type` alias (not an `interface`)
 * so it gets an implicit index signature, keeping structures containing it
 * assignable to Prisma's structural JSON input types.
 */
export type BazaarJsonSchema = {
  type?: string;
  properties?: Record<string, BazaarJsonSchema>;
  required?: string[];
  items?: BazaarJsonSchema;
};

const bazaarJsonSchemaSchema: z3.ZodType<
  BazaarJsonSchema,
  z3.ZodTypeDef,
  unknown
> = z3.lazy(() =>
  z3
    .object({
      type: z3.string().optional().catch(undefined),
      properties: z3.record(bazaarJsonSchemaSchema).optional().catch(undefined),
      required: z3.array(z3.string()).optional().catch(undefined),
      items: bazaarJsonSchemaSchema.optional().catch(undefined),
    })
    .catchall(jsonValueSchema3)
);

/**
 * The `info.input` structure of a bazaar discovery extension. Bazaar servers
 * emit either the v1-style HTTP request structure (method/queryParams/body/…)
 * or "flattened" payload fields; unknown keys are preserved as raw JSON.
 */
const bazaarInputStructureSchema = z3
  .object({
    type: z3.string().optional().catch(undefined),
    method: z3.string().optional().catch(undefined),
    bodyType: z3.string().optional().catch(undefined),
    body: jsonValueSchema3.optional(),
    queryParams: jsonValueSchema3.optional(),
    bodyFields: jsonValueSchema3.optional(),
    headerFields: jsonValueSchema3.optional(),
    headers: jsonValueSchema3.optional(),
    pathParams: jsonValueSchema3.optional(),
    params: jsonValueSchema3.optional(),
  })
  .catchall(jsonValueSchema3);

export type BazaarInputStructure = z3.infer<typeof bazaarInputStructureSchema>;

const bazaarDiscoverySchema = z3.object({
  info: z3
    .object({
      // `catch` keeps malformed bazaar payloads from failing the whole
      // response parse — they degrade to "no schema available".
      input: bazaarInputStructureSchema.optional().catch(undefined),
      output: jsonValueSchema3.optional(),
    })
    .optional(),
  schema: bazaarJsonSchemaSchema.optional().catch(undefined), // JSON Schema format
});

export type BazaarDiscovery = z3.infer<typeof bazaarDiscoverySchema>;

const extensionsSchemaV2 = z3.object({
  bazaar: bazaarDiscoverySchema.optional(),
});

export const x402ResponseSchemaV2 = z3.object({
  x402Version: z3.literal(2),
  error: z3.string().nullish(),
  accepts: z3.array(PaymentRequirementsV2Schema).optional(),
  resource: ResourceInfoSchema.optional(),
  extensions: extensionsSchemaV2.nullish(),
});

export type X402ResponseV2 = z3.infer<typeof x402ResponseSchemaV2>;
