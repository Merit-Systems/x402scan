import type {
  FieldDefinition,
  FieldContext,
  ParseResult,
  ValidationError,
} from './types';
import { normalizeFields } from './normalizer';
import { expandFields } from './field-expander';
import { validateFields } from './validator';

// ==================== MAIN PARSER ====================

/**
 * Parse input fields from various formats into flat FieldDefinition array
 *
 * This is the main entry point for parsing schema fields.
 * It handles:
 * 1. Normalization: Convert various formats to canonical structure
 * 2. Validation: Check for schema errors
 * 3. Expansion: Flatten nested objects to dot notation
 *
 * @param fields - Record of field schemas in any supported format
 * @param context - Context for error messages (queryParams, bodyFields, etc.)
 * @returns ParseResult with FieldDefinition array or validation errors
 */
export function parseInputFields(
  fields: Record<string, unknown> | null | undefined,
  context: FieldContext = 'queryParams'
): ParseResult<FieldDefinition[]> {
  // Handle empty/null input
  if (!fields || Object.keys(fields).length === 0) {
    return { success: true, data: [] };
  }

  // Step 1: Normalize to canonical format
  const normalizeResult = normalizeFields(fields);
  if (!normalizeResult.success) {
    return {
      success: false,
      errors: prefixErrorPaths(normalizeResult.errors, context),
    };
  }

  // Step 2: Validate canonical schemas
  const validateResult = validateFields(normalizeResult.data);
  if (!validateResult.success) {
    return {
      success: false,
      errors: prefixErrorPaths(validateResult.errors, context),
    };
  }

  // Step 3: Expand to flat FieldDefinition array
  const expandResult = expandFields(normalizeResult.data);
  if (!expandResult.success) {
    return {
      success: false,
      errors: prefixErrorPaths(expandResult.errors, context),
    };
  }

  return { success: true, data: expandResult.data };
}

/**
 * Add context prefix to error paths for better debugging
 */
function prefixErrorPaths(
  errors: ValidationError[],
  context: string
): ValidationError[] {
  return errors.map(error => ({
    ...error,
    path: [context, ...error.path],
  }));
}

/**
 * Parse input fields and return empty array on error (safe fallback)
 */
export function parseInputFieldsSafe(
  fields: Record<string, unknown> | null | undefined,
  context: FieldContext = 'queryParams'
): FieldDefinition[] {
  const result = parseInputFields(fields, context);
  return result.success ? result.data : [];
}

/**
 * Check if fields can be parsed successfully (validation check)
 */
export function canParseFields(
  fields: Record<string, unknown> | null | undefined,
  context?: FieldContext
): boolean {
  const result = parseInputFields(fields, context);
  return result.success;
}

