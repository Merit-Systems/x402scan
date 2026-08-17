import { z } from 'zod';

import { jsonValueSchema } from '@/lib/json';

import type { JsonValue } from '@/lib/json';

/**
 * Loosely JSON-shaped data: any JSON value, plus objects/arrays with
 * `undefined` holes as produced by inline literals and optional fields.
 * This is the honest input domain for schema advisories before parsing.
 */
export type JsonLikeValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | JsonLikeValue[]
  | { [key: string]: JsonLikeValue };

/**
 * The subset of JSON Schema / OpenAPI that discovery advisories carry and
 * x402scan consumes (sampling probe bodies, converting to the v1 output
 * schema format).
 */
export interface JsonSchemaNode {
  type?: string;
  format?: string;
  description?: string;
  required?: string[];
  enum?: JsonValue[];
  const?: JsonValue;
  default?: JsonValue;
  example?: JsonValue;
  examples?: JsonValue[];
  minimum?: number;
  properties?: Record<string, JsonSchemaNode>;
  items?: JsonSchemaNode;
  anyOf?: JsonSchemaNode[];
  oneOf?: JsonSchemaNode[];
}

/**
 * Merchant specs are untrusted, so every field is lenient: a malformed field
 * degrades to "absent" (via `.catch`) instead of failing the whole parse.
 * Nodes are loose objects so unrecognized keys survive the round-trip into
 * stored schemas.
 */
const jsonSchemaNodeFields = {
  type: z.string().optional().catch(undefined),
  format: z.string().optional().catch(undefined),
  description: z.string().optional().catch(undefined),
  required: z.array(z.string()).optional().catch(undefined),
  enum: z.array(jsonValueSchema).optional().catch(undefined),
  const: jsonValueSchema.optional(),
  default: jsonValueSchema.optional(),
  example: jsonValueSchema.optional(),
  examples: z.array(jsonValueSchema).optional().catch(undefined),
  minimum: z.number().optional().catch(undefined),
  properties: z
    .record(
      z.string(),
      z.lazy((): z.ZodType<JsonSchemaNode> => jsonSchemaNodeSchema)
    )
    .optional()
    .catch(undefined),
  items: z
    .lazy((): z.ZodType<JsonSchemaNode> => jsonSchemaNodeSchema)
    .optional()
    .catch(undefined),
  anyOf: z
    .array(z.lazy((): z.ZodType<JsonSchemaNode> => jsonSchemaNodeSchema))
    .optional()
    .catch(undefined),
  oneOf: z
    .array(z.lazy((): z.ZodType<JsonSchemaNode> => jsonSchemaNodeSchema))
    .optional()
    .catch(undefined),
};

const jsonSchemaNodeSchema: z.ZodType<JsonSchemaNode> =
  z.looseObject(jsonSchemaNodeFields);

/** OpenAPI parameter object (query, header, path, cookie). */
export interface OpenApiParameter {
  name: string;
  in?: string;
  required?: boolean;
  description?: string;
  schema?: JsonSchemaNode;
}

const openApiParameterSchema: z.ZodType<OpenApiParameter> = z.looseObject({
  name: z.string().min(1),
  in: z.string().optional().catch(undefined),
  required: z.boolean().optional().catch(undefined),
  description: z.string().optional().catch(undefined),
  schema: jsonSchemaNodeSchema.optional().catch(undefined),
});

/** Parameter list where invalid entries are dropped instead of failing. */
const lenientParameterListSchema = z
  .array(openApiParameterSchema.optional().catch(undefined))
  .transform(parameters =>
    parameters.flatMap(parameter =>
      parameter === undefined ? [] : [parameter]
    )
  );

/**
 * The inputSchema advisory from discovery, which can arrive in several
 * shapes:
 *   1. `body.content["application/json"].schema` — full OpenAPI wrapper
 *   2. `requestBody` (+ optional `parameters`) — flattened wrapper from
 *      @agentcash/discovery
 *   3. Direct JSON Schema with `properties`/`type` at top level
 */
export interface OpenApiInputAdvisory extends JsonSchemaNode {
  body?: { content?: { 'application/json'?: { schema?: JsonSchemaNode } } };
  requestBody?: JsonSchemaNode;
  parameters?: OpenApiParameter[];
}

export const openApiInputAdvisorySchema: z.ZodType<OpenApiInputAdvisory> =
  z.looseObject({
    ...jsonSchemaNodeFields,
    body: z
      .looseObject({
        content: z
          .looseObject({
            'application/json': z
              .looseObject({
                schema: jsonSchemaNodeSchema.optional().catch(undefined),
              })
              .optional()
              .catch(undefined),
          })
          .optional()
          .catch(undefined),
      })
      .optional()
      .catch(undefined),
    requestBody: jsonSchemaNodeSchema.optional().catch(undefined),
    parameters: lenientParameterListSchema.optional().catch(undefined),
  });
