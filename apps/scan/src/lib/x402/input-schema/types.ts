import { z } from 'zod';

// ==================== RESULT TYPES ====================

export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; errors: ValidationError[] };

export interface ValidationError {
  path: string[];
  message: string;
  code: string;
  context?: Record<string, unknown>;
}

// ==================== CANONICAL SCHEMA TYPES ====================

/**
 * Internal hierarchical representation of a field schema
 * All formats are normalized to this structure
 */
export interface CanonicalFieldSchema {
  type?: string;
  description?: string;
  required?: boolean;
  enum?: string[];
  default?: string | number | boolean;
  format?: string; // JSON Schema format (email, url, date-time, etc.)
  pattern?: string; // Regex pattern
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  // For object types
  properties?: Record<string, CanonicalFieldSchema>;
  additionalProperties?: boolean;
  // For array types
  items?: CanonicalFieldSchema;
  minItems?: number;
  maxItems?: number;
  // JSON Schema specific
  anyOf?: CanonicalFieldSchema[];
  oneOf?: CanonicalFieldSchema[];
  allOf?: CanonicalFieldSchema[];
  // For nested objects
  requiredFields?: string[]; // List of required property names
}

// ==================== FORMAT DETECTION SCHEMAS ====================

/**
 * JSON Schema format (from z.toJSONSchema())
 * Detected by presence of $schema or complex JSON Schema keywords
 */
export const JsonSchemaFieldSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    type: z.string().optional(),
    description: z.string().optional(),
    enum: z.array(z.string()).optional(),
    format: z.string().optional(),
    pattern: z.string().optional(),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    minimum: z.number().optional(),
    maximum: z.number().optional(),
    exclusiveMinimum: z.number().optional(),
    exclusiveMaximum: z.number().optional(),
    default: z.union([z.string(), z.number(), z.boolean()]).optional(),
    // Object-specific
    properties: z.record(z.lazy(() => JsonSchemaFieldSchema)).optional(),
    required: z.array(z.string()).optional(),
    additionalProperties: z.union([z.boolean(), z.lazy(() => JsonSchemaFieldSchema)]).optional(),
    // Array-specific
    items: z.lazy(() => JsonSchemaFieldSchema).optional(),
    minItems: z.number().optional(),
    maxItems: z.number().optional(),
    // Composition
    anyOf: z.array(z.lazy(() => JsonSchemaFieldSchema)).optional(),
    oneOf: z.array(z.lazy(() => JsonSchemaFieldSchema)).optional(),
    allOf: z.array(z.lazy(() => JsonSchemaFieldSchema)).optional(),
    // Const for enum-like single values
    const: z.union([z.string(), z.number(), z.boolean()]).optional(),
    // Content encoding/media type (for files)
    contentEncoding: z.string().optional(),
    contentMediaType: z.string().optional(),
    // Allow other unknown properties
  }).passthrough()
);

/**
 * Simplified format (our custom format)
 * Just type and required as simple values
 */
export const SimplifiedFieldSchema: z.ZodType<any> = z.lazy(() =>
  z.union([
    // String shorthand
    z.string(),
    // Object form
    z.object({
      type: z.string().optional(),
      description: z.string().optional(),
      required: z.union([z.boolean(), z.array(z.string())]).optional(),
      enum: z.array(z.string()).optional(),
      default: z.union([z.string(), z.number(), z.boolean()]).optional(),
      // Nested properties
      properties: z.record(z.lazy(() => SimplifiedFieldSchema)).optional(),
      // Array items
      items: z.lazy(() => SimplifiedFieldSchema).optional(),
    }).passthrough(),
  ])
);

// ==================== FIELD DEFINITION (OUTPUT) ====================

/**
 * Output format for form rendering
 * This is the existing format used throughout the app
 */
export interface FieldDefinition {
  name: string;
  type?: string;
  description?: string;
  required?: boolean;
  enum?: string[];
  default?: string;
  items?: {
    type?: string;
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

// ==================== CONTEXT ====================

export type FieldContext = 'queryParams' | 'bodyFields' | 'headerFields';

// ==================== HELPER FUNCTIONS ====================

/**
 * Create a validation error
 */
export function createValidationError(
  path: string[],
  message: string,
  code: string,
  context?: Record<string, unknown>
): ValidationError {
  return { path, message, code, context };
}

/**
 * Format error path for display
 */
export function formatErrorPath(path: string[]): string {
  return path.length > 0 ? path.join('.') : '<root>';
}

