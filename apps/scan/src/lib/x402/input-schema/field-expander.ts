import type {
  CanonicalFieldSchema,
  FieldDefinition,
  ValidationError,
  ParseResult,
} from './types';
import { createValidationError } from './types';

// ==================== FIELD EXPANSION ====================

/**
 * Expand a hierarchical canonical schema into flat FieldDefinition array
 * Nested objects are represented with dot notation (e.g., "address.street")
 */
export function expandFields(
  schemas: Record<string, CanonicalFieldSchema>,
  prefix = ''
): ParseResult<FieldDefinition[]> {
  const fields: FieldDefinition[] = [];
  const errors: ValidationError[] = [];

  for (const [name, schema] of Object.entries(schemas)) {
    try {
      const fullName = prefix ? `${prefix}.${name}` : name;
      const expanded = expandField(fullName, schema);
      fields.push(...expanded);
    } catch (error) {
      errors.push(
        createValidationError(
          prefix ? [prefix, name] : [name],
          `Failed to expand field: ${error instanceof Error ? error.message : 'unknown error'}`,
          'EXPANSION_ERROR'
        )
      );
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: fields };
}

/**
 * Expand a single field schema into one or more FieldDefinitions
 */
function expandField(
  name: string,
  schema: CanonicalFieldSchema
): FieldDefinition[] {
  const fields: FieldDefinition[] = [];

  // Handle composition types (anyOf, oneOf, allOf)
  // For now, we'll try to merge them or pick the first valid option
  const resolvedSchema = resolveComposition(schema);

  // If the field has nested properties (object type), expand recursively
  if (resolvedSchema.properties && resolvedSchema.type === 'object') {
    const nestedFields = expandNestedObject(
      name,
      resolvedSchema.properties,
      resolvedSchema.requiredFields ?? []
    );
    fields.push(...nestedFields);
  }
  // Array type with items schema
  else if (resolvedSchema.type === 'array' && resolvedSchema.items) {
    fields.push(createArrayFieldDefinition(name, resolvedSchema));
  }
  // Simple field (string, number, boolean, etc.)
  else {
    fields.push(createSimpleFieldDefinition(name, resolvedSchema));
  }

  return fields;
}

/**
 * Resolve composition keywords (anyOf, oneOf, allOf) into a single schema
 */
function resolveComposition(
  schema: CanonicalFieldSchema
): CanonicalFieldSchema {
  // If there's an allOf, try to merge all schemas
  if (schema.allOf && schema.allOf.length > 0) {
    return mergeSchemas(schema, ...schema.allOf);
  }

  // If there's a oneOf or anyOf, pick the first option (or try to merge if possible)
  if (schema.oneOf && schema.oneOf.length > 0) {
    return mergeSchemas(schema, schema.oneOf[0]);
  }

  if (schema.anyOf && schema.anyOf.length > 0) {
    // For anyOf, we'll pick the most specific one or merge if they're compatible
    return mergeSchemas(schema, schema.anyOf[0]);
  }

  return schema;
}

/**
 * Merge multiple schemas into one (for allOf and simple oneOf/anyOf cases)
 */
function mergeSchemas(
  ...schemas: CanonicalFieldSchema[]
): CanonicalFieldSchema {
  const result: CanonicalFieldSchema = {};

  for (const schema of schemas) {
    // Merge basic properties
    if (schema.type) result.type = schema.type;
    if (schema.description) result.description = schema.description;
    if (schema.required !== undefined) result.required = schema.required;
    if (schema.format) result.format = schema.format;
    if (schema.pattern) result.pattern = schema.pattern;
    if (schema.default !== undefined) result.default = schema.default;

    // Merge enums (intersection)
    if (schema.enum) {
      if (result.enum) {
        result.enum = result.enum.filter(v => schema.enum!.includes(v));
      } else {
        result.enum = schema.enum;
      }
    }

    // Merge constraints (take most restrictive)
    if (schema.minLength !== undefined) {
      result.minLength =
        result.minLength !== undefined
          ? Math.max(result.minLength, schema.minLength)
          : schema.minLength;
    }
    if (schema.maxLength !== undefined) {
      result.maxLength =
        result.maxLength !== undefined
          ? Math.min(result.maxLength, schema.maxLength)
          : schema.maxLength;
    }
    if (schema.minimum !== undefined) {
      result.minimum =
        result.minimum !== undefined
          ? Math.max(result.minimum, schema.minimum)
          : schema.minimum;
    }
    if (schema.maximum !== undefined) {
      result.maximum =
        result.maximum !== undefined
          ? Math.min(result.maximum, schema.maximum)
          : schema.maximum;
    }

    // Merge properties
    if (schema.properties) {
      result.properties = { ...result.properties, ...schema.properties };
    }

    // Merge required fields
    if (schema.requiredFields) {
      result.requiredFields = [
        ...(result.requiredFields ?? []),
        ...schema.requiredFields,
      ];
    }

    // Array items (last one wins)
    if (schema.items) {
      result.items = schema.items;
    }

    // Array constraints
    if (schema.minItems !== undefined) {
      result.minItems =
        result.minItems !== undefined
          ? Math.max(result.minItems, schema.minItems)
          : schema.minItems;
    }
    if (schema.maxItems !== undefined) {
      result.maxItems =
        result.maxItems !== undefined
          ? Math.min(result.maxItems, schema.maxItems)
          : schema.maxItems;
    }
  }

  return result;
}

/**
 * Expand nested object properties into flat fields with dot notation
 */
function expandNestedObject(
  parentName: string,
  properties: Record<string, CanonicalFieldSchema>,
  requiredFields: string[]
): FieldDefinition[] {
  const fields: FieldDefinition[] = [];

  for (const [propName, propSchema] of Object.entries(properties)) {
    const fullName = `${parentName}.${propName}`;
    const isRequired = requiredFields.includes(propName);

    // Add required flag to the schema
    const schemaWithRequired: CanonicalFieldSchema = {
      ...propSchema,
      required: propSchema.required ?? isRequired,
    };

    const expanded = expandField(fullName, schemaWithRequired);
    fields.push(...expanded);
  }

  return fields;
}

/**
 * Create a FieldDefinition for an array field
 */
function createArrayFieldDefinition(
  name: string,
  schema: CanonicalFieldSchema
): FieldDefinition {
  const field: FieldDefinition = {
    name,
    type: 'array',
    description: schema.description,
    required: schema.required ?? false,
    enum: schema.enum,
    default: convertDefaultToString(schema.default),
  };

  // Include items schema for form rendering
  if (schema.items) {
    field.items = {
      type: schema.items.type,
      properties: schema.items.properties as Record<string, unknown> | undefined,
      required: schema.items.requiredFields,
    };
  }

  return field;
}

/**
 * Create a FieldDefinition for a simple field (string, number, etc.)
 */
function createSimpleFieldDefinition(
  name: string,
  schema: CanonicalFieldSchema
): FieldDefinition {
  return {
    name,
    type: schema.type ?? 'string',
    description: schema.description,
    required: schema.required ?? false,
    enum: schema.enum,
    default: convertDefaultToString(schema.default),
  };
}

/**
 * Convert default value to string for FieldDefinition
 */
function convertDefaultToString(
  value: string | number | boolean | undefined
): string | undefined {
  if (value === undefined) return undefined;
  return String(value);
}

