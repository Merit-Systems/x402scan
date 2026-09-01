import z from "zod";
import { Methods } from "@/types/x402";

import { jsonObjectSchema } from "@/lib/json";

import type { FieldDefinition } from "@/types/x402";
import type { JsonObject, JsonValue } from "@/lib/json";
import type { InputSchema } from ".";

/**
 * Headers that are part of the x402/MPP payment protocol and should not
 * be rendered as user-fillable form fields. These are added automatically
 * by the payment flow.
 */
const PROTOCOL_HEADERS = new Set([
  "authorization",
  "payment-signature",
  "payment-required",
  "x-payment",
  "x-payment-signature",
  "sign-in-with-x",
]);

function filterProtocolHeaders(headers: JsonObject): JsonObject {
  const filtered: JsonObject = {};
  for (const [key, value] of Object.entries(headers)) {
    if (!PROTOCOL_HEADERS.has(key.toLowerCase())) {
      filtered[key] = value;
    }
  }
  return filtered;
}

const stringArraySchema = z.array(z.string());

function asJsonObject(value: JsonValue | undefined): JsonObject | undefined {
  const result = jsonObjectSchema.safeParse(value);
  return result.success ? result.data : undefined;
}

function asStringArray(value: JsonValue | undefined): string[] | undefined {
  const result = stringArraySchema.safeParse(value);
  return result.success ? result.data : undefined;
}

/**
 * Extracts field definitions from an x402 input schema.
 * Handles both JSON Schema format (with properties) and simple key-value format.
 */
export function extractFieldsFromSchema(
  inputSchema: InputSchema,
  method: Methods,
  fieldType: "query" | "body" | "header"
): FieldDefinition[] {
  const parsedInput = jsonObjectSchema.safeParse(inputSchema);
  if (!parsedInput.success) {
    return [];
  }
  const input = parsedInput.data;

  if (fieldType === "header") {
    const headerFields = asJsonObject(input.headerFields);
    if (headerFields) {
      return getFields(filterProtocolHeaders(headerFields));
    }
    return [];
  }

  const queryParams = asJsonObject(input.queryParams);
  const body = asJsonObject(input.body);

  const hasJsonSchemaQuery =
    queryParams !== undefined && "properties" in queryParams;
  const hasJsonSchemaBody = body !== undefined && "properties" in body;
  const hasJsonSchemaRaw =
    !input.queryParams && !input.bodyFields && "properties" in input;

  if (fieldType === "query") {
    if (hasJsonSchemaQuery && queryParams) {
      return getFields(
        asJsonObject(queryParams.properties),
        asStringArray(queryParams.required)
      );
    }
    if (input.queryParams) {
      return getFields(queryParams);
    }
    if (hasJsonSchemaRaw && method === Methods.GET) {
      return getFields(
        asJsonObject(input.properties),
        asStringArray(input.required)
      );
    }
    return [];
  }

  // fieldType === 'body'
  if (hasJsonSchemaBody && body && method !== Methods.GET) {
    return getFields(
      asJsonObject(body.properties),
      asStringArray(body.required)
    );
  }
  if (input.bodyFields) {
    return getFields(asJsonObject(input.bodyFields));
  }
  if (hasJsonSchemaRaw && method !== Methods.GET) {
    return getFields(
      asJsonObject(input.properties),
      asStringArray(input.required)
    );
  }
  return [];
}

function getFields(
  record: JsonObject | null | undefined,
  requiredFields?: string[]
): FieldDefinition[] {
  if (!record) {
    return [];
  }
  return expandFields(record, "", requiredFields);
}

const fieldItemsSchema = z
  .object({
    type: z.string().optional().catch(undefined),
    properties: jsonObjectSchema.optional().catch(undefined),
    required: stringArraySchema.optional().catch(undefined),
  })
  .optional()
  .catch(undefined);

const fieldNodeObjectSchema = z.object({
  type: z.string().optional().catch(undefined),
  description: z.string().optional().catch(undefined),
  enum: stringArraySchema.optional().catch(undefined),
  default: z.string().optional().catch(undefined),
  required: z
    .union([z.boolean(), stringArraySchema])
    .optional()
    .catch(undefined),
  properties: jsonObjectSchema.optional().catch(undefined),
  items: fieldItemsSchema,
});

type ParsedFieldNode = z.infer<typeof fieldNodeObjectSchema>;

const fieldNodeSchema = z.union([
  // Shorthand: a bare string is the field's type, e.g. `"string"`.
  z.string().transform((type): ParsedFieldNode => ({ type })),
  fieldNodeObjectSchema,
]);

function expandFields(
  record: JsonObject,
  prefix = "",
  parentRequired?: string[]
): FieldDefinition[] {
  const fields: FieldDefinition[] = [];

  for (const [name, raw] of Object.entries(record)) {
    const fullName = prefix ? `${prefix}.${name}` : name;

    const parsedNode = fieldNodeSchema.safeParse(raw);
    if (!parsedNode.success) {
      continue;
    }
    const field = parsedNode.data;

    const requiredNames = Array.isArray(field.required)
      ? field.required
      : undefined;
    const isFieldRequired =
      field.required === true || field.required === false
        ? field.required
        : (parentRequired?.includes(name) ?? false);

    // Handle array type with items - preserve items schema
    if (field.type === "array" && field.items) {
      fields.push({
        name: fullName,
        type: field.type,
        description: field.description,
        required: isFieldRequired,
        enum: field.enum,
        default: field.default,
        items: {
          type: field.items.type,
          properties: field.items.properties,
          required: field.items.required,
        },
      } satisfies FieldDefinition);
    }
    // Handle object type with properties - expand recursively
    else if (field.type === "object" && field.properties) {
      const expandedFields = expandFields(
        field.properties,
        fullName,
        requiredNames ?? []
      );
      fields.push(...expandedFields);
    } else {
      // Regular field or object without properties
      fields.push({
        name: fullName,
        type: field.type,
        description: field.description,
        required: isFieldRequired,
        enum: field.enum,
        default: field.default,
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
