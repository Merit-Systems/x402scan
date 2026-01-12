import { z as z3 } from 'zod3';

export const FieldDefSchema: z3.ZodTypeAny = z3.lazy(() =>
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

export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; errors: string[] };
