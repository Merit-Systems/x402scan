import { z } from 'zod';

import { jsonObjectSchema, jsonValueSchema } from '@/lib/json';

import type { JsonObject, JsonValue } from '@/lib/json';

type PathScalar = string | number | boolean;

interface PathParameterSchema {
  type?: string;
  const?: JsonValue;
  enum?: JsonValue[];
  example?: JsonValue;
  examples?: JsonValue[];
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
}

const pathParameterSchema: z.ZodType<PathParameterSchema> = z.looseObject({
  type: z.string().optional().catch(undefined),
  const: jsonValueSchema.optional(),
  enum: z.array(jsonValueSchema).optional().catch(undefined),
  example: jsonValueSchema.optional(),
  examples: z.array(jsonValueSchema).optional().catch(undefined),
  pattern: z.string().optional().catch(undefined),
  minLength: z.number().int().nonnegative().optional().catch(undefined),
  maxLength: z.number().int().nonnegative().optional().catch(undefined),
  minimum: z.number().optional().catch(undefined),
  maximum: z.number().optional().catch(undefined),
});

interface PathParameter {
  name: string;
  in: string;
  required?: boolean;
  example?: JsonValue;
  examples?: JsonObject;
  schema?: JsonValue;
}

const pathParameterObjectSchema: z.ZodType<PathParameter> = z.looseObject({
  name: z.string().min(1),
  in: z.string(),
  required: z.boolean().optional().catch(undefined),
  example: jsonValueSchema.optional(),
  examples: jsonObjectSchema.optional().catch(undefined),
  schema: jsonValueSchema.optional(),
});

const referenceSchema = z.object({ $ref: z.string().startsWith('#/') });
const exampleObjectSchema = z.looseObject({
  value: jsonValueSchema.optional(),
});
const scalarSchema = z.union([z.string(), z.number(), z.boolean()]);

export type OpenApiPathInstantiationResult =
  | { success: true; probeUrl: string }
  | { success: false; error: string };

/**
 * Instantiates an OpenAPI path template for probing while leaving the caller's
 * canonical resource URL untouched. Only declared `in: path` parameters and
 * scalar example values are accepted.
 */
export function instantiateOpenApiPathParameterExamples(
  templateUrl: string,
  documentValue: JsonValue,
  method: string
): OpenApiPathInstantiationResult {
  let parsed: URL;
  try {
    parsed = new URL(templateUrl);
  } catch {
    return { success: false, error: `Invalid resource URL: ${templateUrl}` };
  }

  const documentResult = jsonObjectSchema.safeParse(documentValue);
  if (!documentResult.success) {
    return {
      success: false,
      error:
        'Cannot probe parameterized route: OpenAPI document is not an object',
    };
  }
  const document = documentResult.data;
  const templatePath = decodeTemplateBraces(parsed.pathname);
  const placeholderNames = [...templatePath.matchAll(/\{([^{}]+)\}/g)].map(
    match => match[1]
  );
  if (placeholderNames.length === 0) {
    return { success: true, probeUrl: templateUrl };
  }

  const pathsResult = jsonObjectSchema.safeParse(document.paths);
  const pathItemResult = jsonObjectSchema.safeParse(
    pathsResult.success ? pathsResult.data[templatePath] : undefined
  );
  const operationResult = jsonObjectSchema.safeParse(
    pathItemResult.success
      ? pathItemResult.data[method.toLowerCase()]
      : undefined
  );
  if (!pathItemResult.success || !operationResult.success) {
    return {
      success: false,
      error: `Cannot probe parameterized route ${templatePath}: matching OpenAPI operation was not found`,
    };
  }

  const parameters = mergeParameters(
    document,
    pathItemResult.data.parameters,
    operationResult.data.parameters
  );
  let probePath = templatePath;

  for (const name of new Set(placeholderNames)) {
    const parameter = parameters.find(
      candidate => candidate.in === 'path' && candidate.name === name
    );
    if (!parameter) {
      return {
        success: false,
        error: `Cannot probe parameterized route ${templatePath}: required path parameter "${name}" is not declared`,
      };
    }

    const schema = parseParameterSchema(
      document,
      resolveObject(document, parameter.schema)
    );
    const example = selectExample(document, parameter, schema);
    if (example === undefined) {
      return {
        success: false,
        error:
          `Cannot probe parameterized route ${templatePath}: required path parameter "${name}" ` +
          'has no valid scalar example (supported: parameter.example, schema.example, parameter.examples, schema.examples)',
      };
    }

    probePath = probePath.split(`{${name}}`).join(encodePathSegment(example));
  }

  if (/\{[^{}]+\}/.test(probePath)) {
    return {
      success: false,
      error: `Cannot probe parameterized route ${templatePath}: one or more path placeholders could not be resolved`,
    };
  }

  return {
    success: true,
    probeUrl: `${parsed.origin}${probePath}${parsed.search}`,
  };
}

function mergeParameters(
  document: JsonObject,
  pathParameters: JsonValue | undefined,
  operationParameters: JsonValue | undefined
): PathParameter[] {
  const merged = new Map<string, PathParameter>();
  for (const value of [pathParameters, operationParameters]) {
    const listResult = z.array(jsonValueSchema).safeParse(value);
    if (!listResult.success) continue;
    for (const item of listResult.data) {
      const parameterResult = pathParameterObjectSchema.safeParse(
        resolveObject(document, item)
      );
      if (!parameterResult.success) continue;
      const parameter = parameterResult.data;
      merged.set(`${parameter.in}:${parameter.name}`, parameter);
    }
  }
  return [...merged.values()];
}

function parseParameterSchema(
  document: JsonObject,
  value: JsonObject | undefined
): PathParameterSchema | undefined {
  const resolved = resolveObject(document, value);
  const result = pathParameterSchema.safeParse(resolved);
  return result.success ? result.data : undefined;
}

function selectExample(
  document: JsonObject,
  parameter: PathParameter,
  schema: PathParameterSchema | undefined
): PathScalar | undefined {
  const candidates: (JsonValue | undefined)[] = [
    parameter.example,
    schema?.example,
  ];

  if (parameter.examples) {
    for (const value of Object.values(parameter.examples)) {
      const exampleResult = exampleObjectSchema.safeParse(
        resolveObject(document, value)
      );
      candidates.push(
        exampleResult.success ? exampleResult.data.value : undefined
      );
    }
  }

  if (schema?.examples) candidates.push(...schema.examples);

  for (const candidate of candidates) {
    const scalarResult = scalarSchema.safeParse(candidate);
    if (
      scalarResult.success &&
      isSchemaCompatibleScalar(scalarResult.data, schema)
    ) {
      return scalarResult.data;
    }
  }
  return undefined;
}

function isSchemaCompatibleScalar(
  value: PathScalar,
  schema: PathParameterSchema | undefined
): boolean {
  if (!schema) return true;
  if (schema.const !== undefined && value !== schema.const) return false;
  if (schema.enum && !schema.enum.includes(value)) return false;

  if (schema.type === 'string' && !scalarSchemaString.safeParse(value).success)
    return false;
  if (
    schema.type === 'boolean' &&
    !scalarSchemaBoolean.safeParse(value).success
  )
    return false;
  if (schema.type === 'number' && !scalarSchemaNumber.safeParse(value).success)
    return false;
  if (
    schema.type === 'integer' &&
    !scalarSchemaInteger.safeParse(value).success
  )
    return false;
  if (
    schema.type &&
    !['string', 'boolean', 'number', 'integer'].includes(schema.type)
  ) {
    return false;
  }

  const stringResult = scalarSchemaString.safeParse(value);
  if (stringResult.success) {
    if (
      schema.minLength !== undefined &&
      stringResult.data.length < schema.minLength
    )
      return false;
    if (
      schema.maxLength !== undefined &&
      stringResult.data.length > schema.maxLength
    )
      return false;
    if (schema.pattern) {
      try {
        if (!new RegExp(schema.pattern).test(stringResult.data)) return false;
      } catch {
        return false;
      }
    }
  }

  const numberResult = scalarSchemaNumber.safeParse(value);
  if (numberResult.success) {
    if (schema.minimum !== undefined && numberResult.data < schema.minimum)
      return false;
    if (schema.maximum !== undefined && numberResult.data > schema.maximum)
      return false;
  }

  return true;
}

const scalarSchemaString = z.string();
const scalarSchemaBoolean = z.boolean();
const scalarSchemaNumber = z.number();
const scalarSchemaInteger = z.number().int();

function encodePathSegment(value: PathScalar): string {
  return encodeURIComponent(String(value))
    .replace(
      /[!'()*]/g,
      character => `%${character.charCodeAt(0).toString(16).toUpperCase()}`
    )
    .replace(/\./g, '%2E');
}

function decodeTemplateBraces(pathname: string): string {
  return pathname.replace(/%7B/gi, '{').replace(/%7D/gi, '}');
}

function resolveObject(
  document: JsonObject,
  value: JsonValue | undefined,
  seen = new Set<string>()
): JsonObject | undefined {
  const objectResult = jsonObjectSchema.safeParse(value);
  if (!objectResult.success) return undefined;
  const object = objectResult.data;
  const referenceResult = referenceSchema.safeParse(object);
  if (!referenceResult.success) return object;

  const reference = referenceResult.data.$ref;
  if (seen.has(reference)) return undefined;
  seen.add(reference);

  let current: JsonValue = document;
  for (const segment of reference
    .slice(2)
    .split('/')
    .map(value => value.replace(/~1/g, '/').replace(/~0/g, '~'))) {
    const currentResult = jsonObjectSchema.safeParse(current);
    if (!currentResult.success) return undefined;
    const next = currentResult.data[segment];
    if (next === undefined) return undefined;
    current = next;
  }
  return resolveObject(document, current, seen);
}
