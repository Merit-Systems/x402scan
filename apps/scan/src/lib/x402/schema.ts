import type { FieldDefinition, FieldValue } from '@/types/x402';
import { Methods } from '@/types/x402';
import type { InputSchema } from './index';

interface JsonSchema {
  properties?: Record<string, unknown>;
  required?: string[];
}

/**
 * Extracts field definitions from an x402 input schema.
 * Handles both JSON Schema format (with properties) and simple key-value format.
 */
export function extractFieldsFromSchema(
  inputSchema: InputSchema,
  method: Methods,
  fieldType: 'query' | 'body'
): FieldDefinition[] {
  const schema = inputSchema as Record<string, unknown>;
  const schemaBody = schema.body as JsonSchema | undefined;

  const hasJsonSchemaQuery =
    inputSchema.queryParams &&
    typeof inputSchema.queryParams === 'object' &&
    'properties' in (inputSchema.queryParams as object);
  const hasJsonSchemaBody =
    schemaBody && typeof schemaBody === 'object' && 'properties' in schemaBody;
  const hasJsonSchemaRaw =
    !inputSchema.queryParams &&
    !inputSchema.bodyFields &&
    'properties' in schema;

  if (fieldType === 'query') {
    if (hasJsonSchemaQuery) {
      const qs = inputSchema.queryParams as JsonSchema;
      return getFields(qs.properties, qs.required);
    }
    if (inputSchema.queryParams) {
      return getFields(inputSchema.queryParams);
    }
    if (hasJsonSchemaRaw && method === Methods.GET) {
      return getFields(
        (schema as JsonSchema).properties,
        (schema as JsonSchema).required
      );
    }
    return [];
  }

  // fieldType === 'body'
  if (hasJsonSchemaBody && method !== Methods.GET) {
    return getFields(schemaBody.properties, schemaBody.required);
  }
  if (inputSchema.bodyFields) {
    return getFields(inputSchema.bodyFields);
  }
  if (hasJsonSchemaRaw && method !== Methods.GET) {
    return getFields(
      (schema as JsonSchema).properties,
      (schema as JsonSchema).required
    );
  }
  return [];
}

function getFields(
  record: Record<string, unknown> | null | undefined,
  requiredFields?: string[]
): FieldDefinition[] {
  if (!record) {
    return [];
  }
  return expandFields(record, '', requiredFields);
}

function expandFields(
  record: Record<string, unknown>,
  prefix = '',
  parentRequired?: string[]
): FieldDefinition[] {
  const fields: FieldDefinition[] = [];

  for (const [name, raw] of Object.entries(record)) {
    const fullName = prefix ? `${prefix}.${name}` : name;

    if (typeof raw === 'string') {
      fields.push({
        name: fullName,
        type: raw,
        required: parentRequired?.includes(name) ?? false,
        enum: undefined,
        default: undefined,
      } satisfies FieldDefinition);
      continue;
    }

    if (typeof raw !== 'object' || !raw) {
      continue;
    }

    const field = raw as Record<string, unknown>;
    const fieldType = typeof field.type === 'string' ? field.type : undefined;
    const fieldDescription =
      typeof field.description === 'string' ? field.description : undefined;
    const fieldEnum = Array.isArray(field.enum)
      ? (field.enum as string[])
      : undefined;
    const fieldDefault =
      typeof field.default === 'string' ? field.default : undefined;

    const isFieldRequired =
      typeof field.required === 'boolean'
        ? field.required
        : (parentRequired?.includes(name) ?? false);

    // Handle array type with items - preserve items schema
    if (
      fieldType === 'array' &&
      field.items &&
      typeof field.items === 'object'
    ) {
      const items = field.items as Record<string, unknown>;
      fields.push({
        name: fullName,
        type: fieldType,
        description: fieldDescription,
        required: isFieldRequired,
        enum: fieldEnum,
        default: fieldDefault,
        items: {
          type: typeof items.type === 'string' ? items.type : undefined,
          properties:
            typeof items.properties === 'object' && items.properties !== null
              ? (items.properties as Record<string, unknown>)
              : undefined,
          required: Array.isArray(items.required)
            ? (items.required as string[])
            : undefined,
        },
      } satisfies FieldDefinition);
    }
    // Handle object type with properties - expand recursively
    else if (
      fieldType === 'object' &&
      field.properties &&
      typeof field.properties === 'object'
    ) {
      const objectRequired = Array.isArray(field.required)
        ? field.required
        : [];
      const expandedFields = expandFields(
        field.properties as Record<string, unknown>,
        fullName,
        objectRequired
      );
      fields.push(...expandedFields);
    } else {
      // Regular field or object without properties
      fields.push({
        name: fullName,
        type: fieldType,
        description: fieldDescription,
        required: isFieldRequired,
        enum: fieldEnum,
        default: fieldDefault,
      } satisfies FieldDefinition);
    }
  }

  return fields;
}

/**
 * Checks if a field value is valid (non-empty).
 */
export function isValidFieldValue(value: FieldValue): boolean {
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Reconstructs a nested object from dot-notation keys.
 * e.g., { "a.b": 1 } becomes { a: { b: 1 } }
 */
export function reconstructNestedObject(
  flatObject: Record<string, FieldValue | number | boolean>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(flatObject)) {
    // Arrays are already structured correctly, just assign them
    if (Array.isArray(value)) {
      result[key] = value;
      continue;
    }

    const parts = key.split('.');
    let current = result;

    // Navigate/create nested structure
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (part && !(part in current)) {
        current[part] = {};
      }
      current = current[part!] as Record<string, unknown>;
    }

    // Set the final value
    const finalKey = parts[parts.length - 1];
    current[finalKey!] = value;
  }

  return result;
}
