import type {
  CanonicalFieldSchema,
  ValidationError,
  ParseResult,
} from './types';
import { createValidationError } from './types';

// ==================== FORMAT DETECTION ====================

/**
 * Detect which format the field schema is in
 */
function detectFormat(value: unknown): 'json-schema' | 'simplified' | 'string' {
  if (typeof value === 'string') {
    return 'string';
  }

  if (typeof value !== 'object' || value === null) {
    return 'simplified';
  }

  const obj = value as Record<string, unknown>;

  // JSON Schema indicators
  const hasJsonSchemaProps =
    'properties' in obj ||
    'anyOf' in obj ||
    'oneOf' in obj ||
    'allOf' in obj ||
    'format' in obj ||
    'pattern' in obj ||
    'minLength' in obj ||
    'maxLength' in obj ||
    'minimum' in obj ||
    'maximum' in obj ||
    'minItems' in obj ||
    'maxItems' in obj ||
    'additionalProperties' in obj ||
    'contentEncoding' in obj ||
    'contentMediaType' in obj;

  if (hasJsonSchemaProps) {
    return 'json-schema';
  }

  // Check if 'required' is an array (JSON Schema) vs boolean (simplified)
  if ('required' in obj && Array.isArray(obj.required)) {
    return 'json-schema';
  }

  return 'simplified';
}

// ==================== NORMALIZATION FUNCTIONS ====================

/**
 * Normalize a string shorthand to canonical format
 */
function normalizeString(value: string): CanonicalFieldSchema {
  return {
    type: value,
  };
}

/**
 * Normalize a JSON Schema field to canonical format
 */
function normalizeJsonSchemaField(
  value: Record<string, unknown>,
  parentRequired?: string[]
): CanonicalFieldSchema {
  const result: CanonicalFieldSchema = {};

  // Basic properties
  if (typeof value.type === 'string') {
    result.type = value.type;
  }

  if (typeof value.description === 'string') {
    result.description = value.description;
  }

  // Enum handling
  if (Array.isArray(value.enum)) {
    result.enum = value.enum.filter(
      (v): v is string => typeof v === 'string'
    );
  }

  // Default value
  if (
    typeof value.default === 'string' ||
    typeof value.default === 'number' ||
    typeof value.default === 'boolean'
  ) {
    result.default = value.default;
  }

  // Const value (treat as single-value enum)
  if (
    typeof value.const === 'string' ||
    typeof value.const === 'number' ||
    typeof value.const === 'boolean'
  ) {
    result.enum = [String(value.const)];
    result.default = String(value.const);
  }

  // Format (email, url, date-time, etc.)
  if (typeof value.format === 'string') {
    result.format = value.format;
  }

  // Pattern
  if (typeof value.pattern === 'string') {
    result.pattern = value.pattern;
  }

  // String constraints
  if (typeof value.minLength === 'number') {
    result.minLength = value.minLength;
  }
  if (typeof value.maxLength === 'number') {
    result.maxLength = value.maxLength;
  }

  // Number constraints
  if (typeof value.minimum === 'number') {
    result.minimum = value.minimum;
  }
  if (typeof value.maximum === 'number') {
    result.maximum = value.maximum;
  }
  if (typeof value.exclusiveMinimum === 'number') {
    result.minimum = value.exclusiveMinimum;
  }
  if (typeof value.exclusiveMaximum === 'number') {
    result.maximum = value.exclusiveMaximum;
  }

  // Object properties
  if (
    typeof value.properties === 'object' &&
    value.properties !== null &&
    !Array.isArray(value.properties)
  ) {
    const props = value.properties as Record<string, unknown>;
    const requiredFields = Array.isArray(value.required)
      ? (value.required as string[])
      : [];

    result.properties = {};
    for (const [key, propValue] of Object.entries(props)) {
      result.properties[key] = normalizeField(propValue, requiredFields);
    }

    if (requiredFields.length > 0) {
      result.requiredFields = requiredFields;
    }
  }

  // Additional properties
  if (typeof value.additionalProperties === 'boolean') {
    result.additionalProperties = value.additionalProperties;
  }

  // Array items
  if (value.items !== undefined && value.items !== null) {
    result.items = normalizeField(value.items, []);
  }

  // Array constraints
  if (typeof value.minItems === 'number') {
    result.minItems = value.minItems;
  }
  if (typeof value.maxItems === 'number') {
    result.maxItems = value.maxItems;
  }

  // Composition keywords (anyOf, oneOf, allOf)
  if (Array.isArray(value.anyOf)) {
    result.anyOf = value.anyOf.map(v => normalizeField(v, []));
  }
  if (Array.isArray(value.oneOf)) {
    result.oneOf = value.oneOf.map(v => normalizeField(v, []));
  }
  if (Array.isArray(value.allOf)) {
    result.allOf = value.allOf.map(v => normalizeField(v, []));
  }

  return result;
}

/**
 * Normalize a simplified field to canonical format
 */
function normalizeSimplifiedField(
  value: Record<string, unknown>,
  parentRequired?: string[]
): CanonicalFieldSchema {
  const result: CanonicalFieldSchema = {};

  // Basic properties
  if (typeof value.type === 'string') {
    result.type = value.type;
  }

  if (typeof value.description === 'string') {
    result.description = value.description;
  }

  // Required can be boolean or array
  if (typeof value.required === 'boolean') {
    result.required = value.required;
  }

  // Enum
  if (Array.isArray(value.enum)) {
    result.enum = value.enum.filter(
      (v): v is string => typeof v === 'string'
    );
  }

  // Default
  if (
    typeof value.default === 'string' ||
    typeof value.default === 'number' ||
    typeof value.default === 'boolean'
  ) {
    result.default = value.default;
  }

  // Nested properties (for object type)
  if (
    typeof value.properties === 'object' &&
    value.properties !== null &&
    !Array.isArray(value.properties)
  ) {
    const props = value.properties as Record<string, unknown>;
    const requiredFields = Array.isArray(value.required)
      ? (value.required as string[])
      : [];

    result.properties = {};
    for (const [key, propValue] of Object.entries(props)) {
      result.properties[key] = normalizeField(propValue, requiredFields);
    }

    if (requiredFields.length > 0) {
      result.requiredFields = requiredFields;
    }
  }

  // Array items
  if (value.items !== undefined && value.items !== null) {
    result.items = normalizeField(value.items, []);
  }

  return result;
}

/**
 * Normalize a single field value to canonical format
 */
export function normalizeField(
  value: unknown,
  parentRequired?: string[]
): CanonicalFieldSchema {
  if (value === null || value === undefined) {
    return { type: 'string' };
  }

  const format = detectFormat(value);

  switch (format) {
    case 'string':
      return normalizeString(value as string);
    case 'json-schema':
      return normalizeJsonSchemaField(
        value as Record<string, unknown>,
        parentRequired
      );
    case 'simplified':
      if (typeof value === 'object' && !Array.isArray(value)) {
        return normalizeSimplifiedField(
          value as Record<string, unknown>,
          parentRequired
        );
      }
      return { type: 'string' };
  }
}

/**
 * Convert snake_case to camelCase
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Normalize field names (handle snake_case from legacy APIs)
 */
function normalizeFieldName(name: string): string {
  // Keep snake_case as is for now to maintain compatibility
  // The consumer can decide how to handle naming
  return name;
}

/**
 * Normalize a record of fields to canonical format
 */
export function normalizeFields(
  fields: Record<string, unknown> | null | undefined
): ParseResult<Record<string, CanonicalFieldSchema>> {
  if (!fields || typeof fields !== 'object') {
    return { success: true, data: {} };
  }

  const errors: ValidationError[] = [];
  const result: Record<string, CanonicalFieldSchema> = {};

  for (const [key, value] of Object.entries(fields)) {
    try {
      const normalizedName = normalizeFieldName(key);
      result[normalizedName] = normalizeField(value, []);
    } catch (error) {
      errors.push(
        createValidationError(
          [key],
          `Failed to normalize field: ${error instanceof Error ? error.message : 'unknown error'}`,
          'NORMALIZATION_ERROR',
          { originalValue: value }
        )
      );
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: result };
}

