import { outputSchemaV1 } from '@/lib/x402/v1';

import type { OutputSchemaV1 } from '@/lib/x402/v1';

// ─── OpenAPI schema types (from @agentcash/discovery L3 output) ──────────────

/** JSON Schema object with properties, as returned by OpenAPI requestBody extraction. */
interface JsonSchemaObject {
  type?: string;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
}

interface JsonSchemaProperty {
  type?: string;
  description?: string;
  enum?: string[];
  properties?: Record<string, JsonSchemaProperty>;
  items?: JsonSchemaProperty;
}

/** OpenAPI parameter object (query, header, path, cookie). */
interface OpenApiParameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  schema?: JsonSchemaProperty;
  required?: boolean;
  description?: string;
}

// ─── Field definition builder (matches x402scan's FieldDef shape) ────────────

interface FieldDef {
  type?: string;
  required?: boolean;
  description?: string;
  enum?: string[];
  properties?: Record<string, JsonSchemaProperty>;
  items?: JsonSchemaProperty;
}

/**
 * Convert OpenAPI-format inputSchema from the discovery package into
 * the v1 output schema format that x402scan uses for rendering.
 *
 * The discovery package's `extractInputSchema` returns one of:
 *   - A bare JSON Schema (when only requestBody exists)
 *   - `{ requestBody: JsonSchema, parameters: OpenApiParam[] }`
 *   - `{ parameters: OpenApiParam[] }`
 */
export function convertOpenApiSchemaToV1(
  inputSchema: Record<string, unknown>,
  method: string,
  outputSchema?: Record<string, unknown>
): OutputSchemaV1 | undefined {
  const input: Record<string, FieldDef | string | Record<string, FieldDef>> = {
    type: 'http',
    method: method.toUpperCase(),
  };

  const parsed = classifyOpenApiInput(inputSchema);

  if (parsed.body) {
    const bodyFields: Record<string, FieldDef> = {};
    for (const [name, prop] of Object.entries(parsed.body.properties ?? {})) {
      bodyFields[name] = propertyToFieldDef(name, prop, parsed.body.required);
    }
    if (Object.keys(bodyFields).length > 0) {
      input.bodyFields = bodyFields;
      if (input.method === 'GET') input.method = 'POST';
    }
  }

  if (parsed.parameters) {
    const queryParams: Record<string, FieldDef> = {};
    const headerFields: Record<string, FieldDef> = {};

    for (const param of parsed.parameters) {
      const fieldDef = parameterToFieldDef(param);
      if (param.in === 'query') {
        queryParams[param.name] = fieldDef;
      } else if (param.in === 'header') {
        headerFields[param.name] = fieldDef;
      }
    }

    if (Object.keys(queryParams).length > 0) input.queryParams = queryParams;
    if (Object.keys(headerFields).length > 0) input.headerFields = headerFields;
  }

  if (!input.bodyFields && !input.queryParams && !input.headerFields) {
    return undefined;
  }

  return outputSchemaV1.safeParse({
    input,
    output: outputSchema ?? null,
  }).data;
}

/** Classify raw discovery inputSchema into typed body + parameters. */
function classifyOpenApiInput(raw: Record<string, unknown>): {
  body?: JsonSchemaObject;
  parameters?: OpenApiParameter[];
} {
  const hasRequestBody = 'requestBody' in raw;
  const hasParameters = 'parameters' in raw && Array.isArray(raw.parameters);
  const isBareJsonSchema =
    !hasRequestBody && !hasParameters && ('properties' in raw || 'type' in raw);

  return {
    body: hasRequestBody
      ? (raw.requestBody as JsonSchemaObject)
      : isBareJsonSchema
        ? (raw as unknown as JsonSchemaObject)
        : undefined,
    parameters: hasParameters
      ? (raw.parameters as OpenApiParameter[]).filter(
          p => typeof p.name === 'string' && p.name
        )
      : undefined,
  };
}

function propertyToFieldDef(
  name: string,
  prop: JsonSchemaProperty,
  requiredFields?: string[]
): FieldDef {
  return {
    ...(prop.type ? { type: prop.type } : {}),
    ...(requiredFields?.includes(name) ? { required: true } : {}),
    ...(prop.description ? { description: prop.description } : {}),
    ...(prop.enum ? { enum: prop.enum } : {}),
    ...(prop.properties ? { properties: prop.properties } : {}),
    ...(prop.items ? { items: prop.items } : {}),
  };
}

function parameterToFieldDef(param: OpenApiParameter): FieldDef {
  return {
    ...(param.schema?.type ? { type: param.schema.type } : {}),
    ...(param.required ? { required: true } : {}),
    ...(param.description ? { description: param.description } : {}),
    ...(param.schema?.enum ? { enum: param.schema.enum } : {}),
  };
}
