import type {
  CanonicalFieldSchema,
  ValidationError,
  ParseResult,
} from './types';
import { createValidationError } from './types';

// ==================== VALIDATION ====================

/**
 * Validate a record of canonical field schemas
 */
export function validateFields(
  schemas: Record<string, CanonicalFieldSchema>
): ParseResult<Record<string, CanonicalFieldSchema>> {
  const errors: ValidationError[] = [];

  for (const [name, schema] of Object.entries(schemas)) {
    const fieldErrors = validateField([name], schema);
    errors.push(...fieldErrors);
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: schemas };
}

/**
 * Validate a single field schema
 */
function validateField(
  path: string[],
  schema: CanonicalFieldSchema
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate type
  if (schema.type) {
    const validTypes = [
      'string',
      'number',
      'integer',
      'boolean',
      'object',
      'array',
      'null',
    ];
    if (!validTypes.includes(schema.type)) {
      errors.push(
        createValidationError(
          path,
          `Invalid type: "${schema.type}". Must be one of: ${validTypes.join(', ')}`,
          'INVALID_TYPE',
          { type: schema.type }
        )
      );
    }
  }

  // Validate enum
  if (schema.enum) {
    if (!Array.isArray(schema.enum)) {
      errors.push(
        createValidationError(
          path,
          'Enum must be an array',
          'INVALID_ENUM',
          { enum: schema.enum }
        )
      );
    } else if (schema.enum.length === 0) {
      errors.push(
        createValidationError(
          path,
          'Enum array cannot be empty',
          'EMPTY_ENUM'
        )
      );
    }
  }

  // Validate format
  if (schema.format) {
    const validFormats = [
      'date-time',
      'date',
      'time',
      'duration',
      'email',
      'idn-email',
      'hostname',
      'idn-hostname',
      'ipv4',
      'ipv6',
      'uri',
      'uri-reference',
      'iri',
      'iri-reference',
      'uuid',
      'uri-template',
      'json-pointer',
      'relative-json-pointer',
      'regex',
      'binary',
    ];
    if (!validFormats.includes(schema.format)) {
      // Just a warning, don't fail validation for unknown formats
      // Some APIs might use custom formats
    }
  }

  // Validate number constraints
  if (schema.minimum !== undefined && schema.maximum !== undefined) {
    if (schema.minimum > schema.maximum) {
      errors.push(
        createValidationError(
          path,
          `Minimum (${schema.minimum}) cannot be greater than maximum (${schema.maximum})`,
          'INVALID_RANGE',
          { minimum: schema.minimum, maximum: schema.maximum }
        )
      );
    }
  }

  // Validate string constraints
  if (schema.minLength !== undefined && schema.maxLength !== undefined) {
    if (schema.minLength > schema.maxLength) {
      errors.push(
        createValidationError(
          path,
          `minLength (${schema.minLength}) cannot be greater than maxLength (${schema.maxLength})`,
          'INVALID_LENGTH_RANGE',
          { minLength: schema.minLength, maxLength: schema.maxLength }
        )
      );
    }
  }

  // Validate array constraints
  if (schema.minItems !== undefined && schema.maxItems !== undefined) {
    if (schema.minItems > schema.maxItems) {
      errors.push(
        createValidationError(
          path,
          `minItems (${schema.minItems}) cannot be greater than maxItems (${schema.maxItems})`,
          'INVALID_ITEMS_RANGE',
          { minItems: schema.minItems, maxItems: schema.maxItems }
        )
      );
    }
  }

  // Validate object properties
  if (schema.properties) {
    if (schema.type && schema.type !== 'object') {
      errors.push(
        createValidationError(
          path,
          `Field with properties must have type "object", got "${schema.type}"`,
          'TYPE_MISMATCH',
          { type: schema.type }
        )
      );
    }

    // Validate each property recursively
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      const propErrors = validateField([...path, propName], propSchema);
      errors.push(...propErrors);
    }

    // Validate required fields exist in properties
    if (schema.requiredFields) {
      for (const requiredField of schema.requiredFields) {
        if (!(requiredField in schema.properties)) {
          errors.push(
            createValidationError(
              path,
              `Required field "${requiredField}" not found in properties`,
              'MISSING_REQUIRED_PROPERTY',
              { requiredField, availableProperties: Object.keys(schema.properties) }
            )
          );
        }
      }
    }
  }

  // Validate array items
  if (schema.items) {
    if (schema.type && schema.type !== 'array') {
      errors.push(
        createValidationError(
          path,
          `Field with items must have type "array", got "${schema.type}"`,
          'TYPE_MISMATCH',
          { type: schema.type }
        )
      );
    }

    // Validate items schema recursively
    const itemsErrors = validateField([...path, 'items'], schema.items);
    errors.push(...itemsErrors);
  }

  // Validate composition keywords
  if (schema.anyOf) {
    for (let i = 0; i < schema.anyOf.length; i++) {
      const schemaErrors = validateField([...path, `anyOf[${i}]`], schema.anyOf[i]);
      errors.push(...schemaErrors);
    }
  }

  if (schema.oneOf) {
    for (let i = 0; i < schema.oneOf.length; i++) {
      const schemaErrors = validateField([...path, `oneOf[${i}]`], schema.oneOf[i]);
      errors.push(...schemaErrors);
    }
  }

  if (schema.allOf) {
    for (let i = 0; i < schema.allOf.length; i++) {
      const schemaErrors = validateField([...path, `allOf[${i}]`], schema.allOf[i]);
      errors.push(...schemaErrors);
    }
  }

  // Validate pattern
  if (schema.pattern) {
    try {
      new RegExp(schema.pattern);
    } catch (error) {
      errors.push(
        createValidationError(
          path,
          `Invalid regex pattern: ${error instanceof Error ? error.message : 'unknown error'}`,
          'INVALID_PATTERN',
          { pattern: schema.pattern }
        )
      );
    }
  }

  return errors;
}

/**
 * Check if schema has any validation errors (quick check)
 */
export function hasValidationErrors(
  schemas: Record<string, CanonicalFieldSchema>
): boolean {
  const result = validateFields(schemas);
  return !result.success;
}

/**
 * Get validation errors as formatted strings
 */
export function getValidationErrorMessages(errors: ValidationError[]): string[] {
  return errors.map(error => {
    const path = error.path.join('.');
    return `${path}: ${error.message}`;
  });
}

