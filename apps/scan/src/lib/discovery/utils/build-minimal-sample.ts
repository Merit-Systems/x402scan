/**
 * Minimal required-fields sampler. Walks an OpenAPI-style JSON Schema and
 * fills required properties with type-appropriate defaults. No regex walking,
 * no format inference, no constraint solving — just enough to pass basic
 * request validation so the x402 paywall can fire.
 */

import { z } from 'zod';

import { openApiInputAdvisorySchema } from './json-schema';

import type { JsonLikeValue, JsonSchemaNode } from './json-schema';
import type { JsonObject, JsonValue } from '@/lib/json';

const HTTP_METHODS = ['post', 'put', 'patch', 'delete', 'get', 'head'] as const;

const MAX_DEPTH = 5;

function sampleValue(
  schema: JsonSchemaNode,
  depth: number
): JsonValue | undefined {
  if (depth > MAX_DEPTH) return undefined;

  // Use enum/const/default/example if available
  if ('const' in schema) return schema.const;
  if ('default' in schema) return schema.default;
  if ('example' in schema) return schema.example;
  if (schema.examples !== undefined && schema.examples.length > 0) {
    return schema.examples[0];
  }
  if (schema.enum !== undefined && schema.enum.length > 0) {
    return schema.enum[0];
  }

  if (schema.type === 'object' || schema.properties) {
    return buildMinimalSample(schema, depth + 1);
  }
  if (schema.type === 'array') {
    if (schema.items) {
      const item = sampleValue(schema.items, depth + 1);
      return item !== undefined ? [item] : [];
    }
    return [];
  }
  if (schema.type === 'string') {
    if (schema.format === 'uri' || schema.format === 'url') {
      return 'https://placehold.co/1x1.png';
    }
    if (schema.format === 'email') return 'test@example.com';
    if (schema.format === 'date') return '2025-01-01';
    if (schema.format === 'date-time') return '2025-01-01T00:00:00Z';
    if (schema.format === 'uuid') return '00000000-0000-0000-0000-000000000000';
    return 'test';
  }
  if (schema.type === 'number' || schema.type === 'integer') {
    return schema.minimum ?? 0;
  }
  if (schema.type === 'boolean') return true;

  return 'test';
}

function buildMinimalSample(
  schema: JsonSchemaNode,
  depth = 0
): JsonObject | undefined {
  const properties = schema.properties;
  if (!properties) return undefined;

  const required = new Set(schema.required ?? []);

  // Merge required fields from the first anyOf/oneOf branch. Endpoints with
  // conditional requirements (e.g. "one of contentBase64 or contentText")
  // express them this way — pick the first branch so the probe body passes
  // validation and the x402 paywall can fire.
  const compositeBranches = schema.anyOf ?? schema.oneOf;
  if (compositeBranches !== undefined && compositeBranches.length > 0) {
    const firstBranch = compositeBranches[0];
    if (firstBranch?.required) {
      for (const key of firstBranch.required) {
        required.add(key);
      }
    }
  }

  // Only fill properties explicitly marked required. If the merchant doesn't
  // mark required fields, that's their spec to fix.
  const keys = Object.keys(properties).filter(k => required.has(k));

  if (keys.length === 0) return undefined;

  const result: JsonObject = {};
  for (const key of keys) {
    const propSchema = properties[key];
    if (!propSchema) continue;
    const value = sampleValue(propSchema, depth);
    if (value !== undefined) {
      result[key] = value;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Extracts the request body schema from an inputSchema advisory and builds a
 * minimal sample body with only required fields filled with type defaults.
 *
 * Returns undefined if no usable schema is found.
 */
export function buildMinimalSampleFromInputSchema(
  inputSchema: JsonLikeValue
): JsonObject | undefined {
  const advisory = openApiInputAdvisorySchema.safeParse(inputSchema);
  if (!advisory.success) return undefined;

  const media = advisory.data.body?.content?.['application/json'];
  const wrappedSchema = media?.schema;
  const effectiveSchema =
    wrappedSchema ?? advisory.data.requestBody ?? advisory.data;

  // A merchant-declared object example is a body the server already accepted
  // as a shape. Property defaults (including the URI placeholder) are only
  // for specs that do not provide one.
  const declared =
    declaredObjectExample(media) ?? declaredObjectExample(effectiveSchema);
  if (declared) return declared;

  return buildMinimalSample(effectiveSchema);
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Pulls a probe body from one example entry. Does not fetch externalValue. */
function exampleValue(entry: unknown): JsonObject | undefined {
  if (!isJsonObject(entry)) return undefined;
  if ('value' in entry) {
    return isJsonObject(entry.value) && Object.keys(entry.value).length > 0
      ? entry.value
      : undefined;
  }
  if (
    'externalValue' in entry ||
    'summary' in entry ||
    'description' in entry ||
    '$ref' in entry
  ) {
    return undefined;
  }
  return Object.keys(entry).length > 0 ? entry : undefined;
}

/** A non-empty JSON object example. Empty objects fall through to synthesis. */
function declaredObjectExample(carrier: unknown): JsonObject | undefined {
  if (!isJsonObject(carrier)) return undefined;

  const direct = isJsonObject(carrier.example) ? carrier.example : undefined;
  if (direct && Object.keys(direct).length > 0) return direct;

  const examples = carrier.examples;
  const entries = Array.isArray(examples)
    ? examples
    : isJsonObject(examples)
      ? Object.values(examples)
      : [];
  for (const entry of entries) {
    const found = exampleValue(entry);
    if (found) return found;
  }
  return undefined;
}

function mediaTypeExample(requestBody: unknown): JsonObject | undefined {
  if (!isJsonObject(requestBody) || !isJsonObject(requestBody.content)) {
    return undefined;
  }
  const content = requestBody.content;
  const jsonMedia = content['application/json'];
  const fromJson = declaredObjectExample(jsonMedia);
  if (fromJson) return fromJson;
  for (const media of Object.values(content)) {
    const found = declaredObjectExample(media);
    if (found) return found;
  }
  return undefined;
}

function pathPattern(specPath: string): RegExp {
  const source = specPath
    .split(/(\{[^}]+\})/)
    .map(part =>
      part.startsWith('{') && part.endsWith('}')
        ? '[^/]+'
        : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    )
    .join('');
  return new RegExp(`^${source}$`);
}

function matchPathItem(
  paths: Record<string, unknown>,
  targetPath: string
): Record<string, unknown> | undefined {
  if (Object.prototype.hasOwnProperty.call(paths, targetPath)) {
    const exact = paths[targetPath];
    return isJsonObject(exact) ? exact : undefined;
  }
  for (const [specPath, entry] of Object.entries(paths)) {
    if (!isJsonObject(entry)) continue;
    if (pathPattern(specPath).test(targetPath)) return entry;
  }
  return undefined;
}

/**
 * Reads an OpenAPI operation's requestBody media-type example.
 * `@agentcash/discovery` 1.7.5 returns only the JSON schema, so callers that
 * hold the raw document use this before synthesizing a probe body.
 * `externalValue` examples are not fetched.
 */
export function declaredRequestExample(
  document: unknown,
  path: string,
  method?: string
): JsonObject | undefined {
  if (!isJsonObject(document) || !isJsonObject(document.paths)) {
    return undefined;
  }
  const pathItem = matchPathItem(document.paths, path);
  if (!pathItem) return undefined;

  const names = method ? [method.toLowerCase()] : [...HTTP_METHODS];
  for (const name of names) {
    const operation = pathItem[name];
    if (!isJsonObject(operation)) continue;
    const fromMedia = mediaTypeExample(operation.requestBody);
    if (fromMedia) return fromMedia;
    const requestBody = isJsonObject(operation.requestBody)
      ? operation.requestBody
      : undefined;
    const content = isJsonObject(requestBody?.content)
      ? requestBody.content
      : undefined;
    const jsonMedia = isJsonObject(content?.['application/json'])
      ? content['application/json']
      : undefined;
    const fromSchema = declaredObjectExample(jsonMedia?.schema);
    if (fromSchema) return fromSchema;
  }
  return undefined;
}

/** Declared example wins. Synthesis is the fallback, never a mix of the two. */
export function selectProbeBody(
  declared: JsonObject | undefined,
  synthesized: JsonObject | undefined
): JsonObject {
  if (declared && Object.keys(declared).length > 0) return declared;
  return synthesized ?? {};
}

const scalarJsonSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

/** Serializes a sampled scalar; non-scalar JSON falls back to JSON text. */
function scalarParamValue(value: JsonValue): string {
  const scalar = scalarJsonSchema.safeParse(value);
  return scalar.success ? String(scalar.data) : JSON.stringify(value);
}

/** Serializes a sampled value into a query-string value. */
function queryParamValue(value: JsonValue): string {
  if (Array.isArray(value)) return value.map(scalarParamValue).join(',');
  return scalarParamValue(value);
}

/**
 * Extracts required query parameters from an inputSchema advisory and builds
 * a minimal query string map. Only includes params explicitly marked
 * `required: true`. Uses defaults/examples from the schema when available,
 * otherwise fills with type-appropriate values.
 */
export function buildMinimalQueryParamsFromInputSchema(
  inputSchema: JsonLikeValue
): Record<string, string> | undefined {
  const advisory = openApiInputAdvisorySchema.safeParse(inputSchema);
  if (!advisory.success) return undefined;

  const parameters = advisory.data.parameters;
  if (!parameters || parameters.length === 0) return undefined;

  const result: Record<string, string> = {};

  for (const param of parameters) {
    if (param.in !== 'query') continue;
    if (!param.required) continue;

    if (param.schema) {
      const value = sampleValue(param.schema, 0);
      if (value !== undefined) {
        result[param.name] = queryParamValue(value);
        continue;
      }
    }
    result[param.name] = 'test';
  }

  return Object.keys(result).length > 0 ? result : undefined;
}
