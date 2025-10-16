import {
  HTTPRequestStructureSchema,
  PaymentRequirementsSchema,
  x402ResponseSchema,
} from 'x402/types';
import { z as z3 } from 'zod3';
import { normalizeX402Fields } from './utils';

// ==================== TYPES ====================

// Handle both string shorthand and object field definitions with recursive properties
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
    })
  )
);

const EnhancedOutputSchema = z3.object({
  input: HTTPRequestStructureSchema.omit({
    queryParams: true,
    bodyFields: true,
    headerFields: true,
  }).extend({
    headerFields: z3.record(FieldDefSchema).optional(),
    queryParams: z3.record(FieldDefSchema).optional(),
    bodyFields: z3.record(FieldDefSchema).optional(),
  }),
  output: z3.record(z3.string(), z3.any()).optional(),
});

export type EnhancedOutputSchema = z3.infer<typeof EnhancedOutputSchema>;

const EnhancedX402ResponseSchema = x402ResponseSchema
  .omit({
    error: true,
    accepts: true,
  })
  .extend({
    error: z3.string().optional(), // Accept any error string
    accepts: z3
      .array(
        PaymentRequirementsSchema.extend({
          outputSchema: EnhancedOutputSchema.optional(),
        })
      )
      .optional(),
  });

// Types
export type ParsedX402Response = z3.infer<typeof EnhancedX402ResponseSchema>;

type Result<T> =
  | { success: true; data: T }
  | { success: false; errors: string[] };

// ==================== MAIN EXPORTS ====================

/**
 * Parse and validate x402 response data with lenient error field handling
 * Returns enhanced response with normalized, strongly-typed outputSchema
 */
export function parseX402Response(data: unknown): Result<ParsedX402Response> {
  // Step 1: Selective snake → camel conversion (only for x402 protocol fields, not API schemas)
  const normalized = normalizeX402Fields(data);

  // Step 2: Parse with our enhanced schema (handles everything!)
  const result = EnhancedX402ResponseSchema.safeParse(normalized);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Format errors
  const errors = result.error.issues.map(
    issue => `${issue.path.join('.')}: ${issue.message}`
  );
  return { success: false, errors };
}
