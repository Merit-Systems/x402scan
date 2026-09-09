import { z as z3 } from "zod3";

import type { JsonValue } from "@/lib/json";

/**
 * zod3 counterpart of `jsonValueSchema` from `@/lib/json`, for schemas that
 * must stay zod3-compatible with the `@x402` packages.
 */
export const jsonValueSchema3: z3.ZodType<JsonValue, z3.ZodTypeDef, unknown> =
  z3.lazy(() =>
    z3.union([
      z3.string(),
      z3.number(),
      z3.boolean(),
      z3.null(),
      z3.array(jsonValueSchema3),
      z3.record(jsonValueSchema3),
    ])
  );

export const jsonObjectSchema3 = z3.record(jsonValueSchema3);

// A `type` alias (not an `interface`) so it gets an implicit index signature,
// which keeps zod-inferred structures containing FieldDef assignable to
// Prisma's structural JSON input types.
export type FieldDef = {
  type?: string;
  required?: boolean | string[];
  description?: string;
  enum?: string[];
  properties?: Record<string, FieldDef>;
  items?: FieldDef;
};

export const FieldDefSchema: z3.ZodType<FieldDef, z3.ZodTypeDef, unknown> =
  z3.lazy(() =>
    z3.union([
      // Shorthand: a bare string is the field's type, e.g. `"string"`.
      z3.string().transform((type) => ({ type })),
      z3.object({
        type: z3.string().optional(),
        required: z3.union([z3.boolean(), z3.array(z3.string())]).optional(),
        description: z3.string().optional(),
        enum: z3.array(z3.string()).optional(),
        properties: z3.record(FieldDefSchema).optional(),
        items: FieldDefSchema.optional(),
      }),
    ])
  );

export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; errors: string[] };
