/**
 * Minimal required-fields sampler. Walks an OpenAPI-style JSON Schema and
 * fills required properties with type-appropriate defaults. No regex walking,
 * no format inference, no constraint solving — just enough to pass basic
 * request validation so the x402 paywall can fire.
 */

const MAX_DEPTH = 5;

function sampleValue(schema: Record<string, unknown>, depth: number): unknown {
  if (depth > MAX_DEPTH) return undefined;

  // Use enum/const/default/example if available
  if ('const' in schema) return schema.const;
  if ('default' in schema) return schema.default;
  if ('example' in schema) return schema.example;
  if (Array.isArray(schema.examples) && schema.examples.length > 0) {
    return schema.examples[0];
  }
  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return schema.enum[0];
  }

  const type = schema.type as string | undefined;

  if (type === 'object' || schema.properties) {
    return buildMinimalSample(schema, depth + 1);
  }
  if (type === 'array') {
    const items = schema.items as Record<string, unknown> | undefined;
    if (items) {
      const item = sampleValue(items, depth + 1);
      return item !== undefined ? [item] : [];
    }
    return [];
  }
  if (type === 'string') {
    if (schema.format === 'uri' || schema.format === 'url') {
      return 'https://placehold.co/1x1.png';
    }
    if (schema.format === 'email') return 'test@example.com';
    if (schema.format === 'date') return '2025-01-01';
    if (schema.format === 'date-time') return '2025-01-01T00:00:00Z';
    if (schema.format === 'uuid') return '00000000-0000-0000-0000-000000000000';
    return 'test';
  }
  if (type === 'number' || type === 'integer') {
    if (typeof schema.minimum === 'number') return schema.minimum;
    return 0;
  }
  if (type === 'boolean') return true;

  return 'test';
}

function buildMinimalSample(
  schema: Record<string, unknown>,
  depth = 0
): Record<string, unknown> | undefined {
  const properties = schema.properties as
    | Record<string, Record<string, unknown>>
    | undefined;
  if (!properties) return undefined;

  const required = Array.isArray(schema.required)
    ? new Set(schema.required as string[])
    : new Set<string>();

  // Merge required fields from the first anyOf/oneOf branch. Endpoints with
  // conditional requirements (e.g. "one of contentBase64 or contentText")
  // express them this way — pick the first branch so the probe body passes
  // validation and the x402 paywall can fire.
  const compositeBranches = (schema.anyOf ?? schema.oneOf) as
    | Record<string, unknown>[]
    | undefined;
  if (Array.isArray(compositeBranches) && compositeBranches.length > 0) {
    const firstBranch = compositeBranches[0];
    if (firstBranch && Array.isArray(firstBranch.required)) {
      for (const key of firstBranch.required as string[]) {
        required.add(key);
      }
    }
  }

  // Only fill properties explicitly marked required. If the merchant doesn't
  // mark required fields, that's their spec to fix.
  const keys = Object.keys(properties).filter(k => required.has(k));

  if (keys.length === 0) return undefined;

  const result: Record<string, unknown> = {};
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
  inputSchema: unknown
): Record<string, unknown> | undefined {
  if (
    typeof inputSchema !== 'object' ||
    inputSchema === null ||
    Array.isArray(inputSchema)
  ) {
    return undefined;
  }

  const schema = inputSchema as Record<string, unknown>;

  // The inputSchema from OpenAPI advisories wraps the body schema under
  // `body.content["application/json"].schema` or may be the schema directly.
  const bodyContent = (schema.body as Record<string, unknown>)?.content as
    | Record<string, unknown>
    | undefined;
  const jsonSchema = (
    bodyContent?.['application/json'] as Record<string, unknown>
  )?.schema as Record<string, unknown> | undefined;

  const effectiveSchema = jsonSchema ?? schema;

  return buildMinimalSample(effectiveSchema);
}

/**
 * Extracts required query parameters from an inputSchema advisory and builds
 * a minimal query string map. Only includes params explicitly marked
 * `required: true`. Uses defaults/examples from the schema when available,
 * otherwise fills with type-appropriate values.
 */
export function buildMinimalQueryParamsFromInputSchema(
  inputSchema: unknown
): Record<string, string> | undefined {
  if (typeof inputSchema !== 'object' || inputSchema === null) return undefined;

  const schema = inputSchema as Record<string, unknown>;
  const parameters = schema.parameters as unknown[] | undefined;
  if (!Array.isArray(parameters) || parameters.length === 0) return undefined;

  const result: Record<string, string> = {};

  for (const param of parameters) {
    if (typeof param !== 'object' || param === null) continue;
    const p = param as Record<string, unknown>;
    if (p.in !== 'query') continue;

    const name = p.name as string | undefined;
    const required = p.required as boolean | undefined;
    if (!name || !required) continue;

    const paramSchema = p.schema as Record<string, unknown> | undefined;
    if (paramSchema) {
      const value = sampleValue(paramSchema, 0);
      if (value !== undefined) {
        if (Array.isArray(value)) {
          result[name] = value.join(',');
        } else if (typeof value === 'object' && value !== null) {
          result[name] = JSON.stringify(value);
        } else {
          result[name] = String(value as string | number | boolean);
        }
        continue;
      }
    }
    result[name] = 'test';
  }

  return Object.keys(result).length > 0 ? result : undefined;
}
