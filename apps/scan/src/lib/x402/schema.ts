import z from 'zod';
import { Methods } from '@/types/x402';

import type { FieldDefinition } from '@/types/x402';
import type { InputSchema } from '.';

interface JsonSchema {
  properties?: Record<string, unknown>;
  required?: string[];
}

/**
 * Headers that are part of the x402/MPP payment protocol and should not
 * be rendered as user-fillable form fields. These are added automatically
 * by the payment flow.
 */
const PROTOCOL_HEADERS = new Set([
  'authorization',
  'payment-signature',
  'payment-required',
  'x-payment',
  'x-payment-signature',
  'sign-in-with-x',
]);

function filterProtocolHeaders(
  headers: Record<string, unknown>
): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (!PROTOCOL_HEADERS.has(key.toLowerCase())) {
      filtered[key] = value;
    }
  }
  return filtered;
}

/**
 * Extracts field definitions from an x402 input schema.
 * Handles both JSON Schema format (with properties) and simple key-value format.
 */
export function extractFieldsFromSchema(
  inputSchema: InputSchema,
  method: Methods,
  fieldType: 'query' | 'body' | 'header'
): FieldDefinition[] {
  const schema = inputSchema as Record<string, unknown>;
  const schemaBody = schema.body as JsonSchema | undefined;

  if (fieldType === 'header') {
    const headerFields = (
      inputSchema as unknown as { headerFields?: Record<string, unknown> }
    ).headerFields;
    if (headerFields && typeof headerFields === 'object') {
      return getFields(filterProtocolHeaders(headerFields));
    }
    const headerFieldsRaw = schema.headerFields as
      | Record<string, unknown>
      | undefined;
    if (headerFieldsRaw && typeof headerFieldsRaw === 'object') {
      return getFields(filterProtocolHeaders(headerFieldsRaw));
    }
    return [];
  }

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

export const paymentResponseHeaderSchema = z.object({
  success: z.boolean(),
  transaction: z.string(),
  network: z.string(),
  payer: z.string(),
});
