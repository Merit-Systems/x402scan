// ==================== PUBLIC API ====================

/**
 * Input Schema Parser
 *
 * A type-safe module for parsing and validating x402 input schemas.
 * Supports multiple formats:
 * - Full JSON Schema (from z.toJSONSchema())
 * - Simplified format (type + required)
 * - Legacy formats (snake_case fields)
 *
 * Usage:
 *   import { parseInputFields } from '@/lib/x402/input-schema';
 *
 *   const result = parseInputFields(inputSchema.queryParams, 'queryParams');
 *   if (result.success) {
 *     // Use result.data (FieldDefinition[])
 *   } else {
 *     // Handle result.errors (ValidationError[])
 *   }
 */

// Main parser function
export { parseInputFields, parseInputFieldsSafe, canParseFields } from './parser';

// Types
export type {
  FieldDefinition,
  FieldContext,
  ParseResult,
  ValidationError,
  CanonicalFieldSchema,
} from './types';

// Helper functions
export { createValidationError, formatErrorPath } from './types';
export { getValidationErrorMessages, hasValidationErrors } from './validator';

