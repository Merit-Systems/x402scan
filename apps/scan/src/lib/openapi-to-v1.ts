import { openApiInputAdvisorySchema } from "@/lib/discovery/utils/json-schema";
import { outputSchemaV1 } from "@/lib/x402/v1";

import type {
  JsonSchemaNode,
  OpenApiInputAdvisory,
  OpenApiParameter,
} from "@/lib/discovery/utils/json-schema";
import type { JsonValue } from "@/lib/json";
import type { OutputSchemaV1 } from "@/lib/x402/v1";
import type { EndpointMethodAdvisory } from "@agentcash/discovery";

// ─── Field definition builder (matches x402scan's FieldDef shape) ────────────

interface FieldDef {
  type?: string;
  required?: boolean;
  description?: string;
  enum?: JsonValue[];
  properties?: Record<string, JsonSchemaNode>;
  items?: JsonSchemaNode;
}

/** Draft of the v1 `input` block, validated by outputSchemaV1 at the end. */
interface V1InputDraft {
  type: "http";
  method: string;
  bodyFields?: Record<string, FieldDef>;
  queryParams?: Record<string, FieldDef>;
  headerFields?: Record<string, FieldDef>;
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
  inputSchema: NonNullable<EndpointMethodAdvisory["inputSchema"]>,
  method: string,
  outputSchema?: EndpointMethodAdvisory["outputSchema"]
): OutputSchemaV1 | undefined {
  const parsedInput = openApiInputAdvisorySchema.safeParse(inputSchema);
  if (!parsedInput.success) return undefined;

  const input: V1InputDraft = {
    type: "http",
    method: method.toUpperCase(),
  };

  const parsed = classifyOpenApiInput(parsedInput.data);

  if (parsed.body) {
    const bodyFields: Record<string, FieldDef> = {};
    for (const [name, prop] of Object.entries(parsed.body.properties ?? {})) {
      bodyFields[name] = propertyToFieldDef(name, prop, parsed.body.required);
    }
    if (Object.keys(bodyFields).length > 0) {
      input.bodyFields = bodyFields;
      if (input.method === "GET") input.method = "POST";
    }
  }

  if (parsed.parameters) {
    const queryParams: Record<string, FieldDef> = {};
    const headerFields: Record<string, FieldDef> = {};

    for (const param of parsed.parameters) {
      const fieldDef = parameterToFieldDef(param);
      if (param.in === "query") {
        queryParams[param.name] = fieldDef;
      } else if (param.in === "header") {
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

interface ClassifiedOpenApiInput {
  body?: JsonSchemaNode;
  parameters?: OpenApiParameter[];
}

/** Classify a parsed discovery inputSchema into body + parameters. */
function classifyOpenApiInput(
  advisory: OpenApiInputAdvisory
): ClassifiedOpenApiInput {
  const hasRequestBody = "requestBody" in advisory;
  const isBareJsonSchema =
    !hasRequestBody &&
    advisory.parameters === undefined &&
    ("properties" in advisory || "type" in advisory);

  return {
    body: hasRequestBody
      ? advisory.requestBody
      : isBareJsonSchema
        ? advisory
        : undefined,
    parameters: advisory.parameters,
  };
}

function propertyToFieldDef(
  name: string,
  prop: JsonSchemaNode,
  requiredFields?: string[]
): FieldDef {
  const field: FieldDef = {};
  if (prop.type) field.type = prop.type;
  if (requiredFields?.includes(name)) field.required = true;
  if (prop.description) field.description = prop.description;
  if (prop.enum) field.enum = prop.enum;
  if (prop.properties) field.properties = prop.properties;
  if (prop.items) field.items = prop.items;
  return field;
}

function parameterToFieldDef(param: OpenApiParameter): FieldDef {
  const field: FieldDef = {};
  if (param.schema?.type) field.type = param.schema.type;
  if (param.required) field.required = true;
  if (param.description) field.description = param.description;
  if (param.schema?.enum) field.enum = param.schema.enum;
  return field;
}
