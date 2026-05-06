/**
 * Builds a minimum-valid sample request body from an OpenAPI input schema.
 *
 * Used by probeX402Endpoint as a fallback when a no-body probe gets rejected
 * by request validation (e.g. HTTP 400) before the paywall middleware can
 * issue its 402 challenge. Walking the spec's required fields yields a body
 * that satisfies validation so the live 402 — including chain-level
 * payTo/asset/network details — is reachable.
 */

const MAX_DEPTH = 8;

type JsonSchema = Record<string, unknown>;

function isRecord(value: unknown): value is JsonSchema {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

function sampleNumber(schema: JsonSchema, isInteger: boolean): number {
  // Honor (exclusive)minimum / (exclusive)maximum so the sample lands inside
  // the schema's accepted range. Without this, `{ type: "number",
  // exclusiveMinimum: 0 }` was returning 0 and the probe re-request was
  // being rejected with 400 before it ever reached the paywall.
  const min = asNumber(schema.minimum);
  const exMin = asNumber(schema.exclusiveMinimum);
  const max = asNumber(schema.maximum);
  const exMax = asNumber(schema.exclusiveMaximum);

  const step = isInteger ? 1 : 0.000001;
  const lower = exMin !== undefined ? exMin + step : min;
  const upper = exMax !== undefined ? exMax - step : max;

  let value = 0;
  if (lower !== undefined && upper !== undefined) {
    value = lower <= upper ? lower : upper;
  } else if (lower !== undefined) {
    value = lower > 0 ? lower : Math.max(lower, 1);
  } else if (upper !== undefined) {
    value = upper >= 0 ? 0 : upper;
  }

  return isInteger ? Math.trunc(value) : value;
}

function sampleString(schema: JsonSchema): string {
  const minLength =
    typeof schema.minLength === 'number' && schema.minLength > 0
      ? schema.minLength
      : 0;
  const base = 'sample';
  if (minLength <= base.length) return base;
  return base + 'x'.repeat(minLength - base.length);
}

function buildFromSchema(schema: unknown, depth: number): unknown {
  if (depth > MAX_DEPTH || !isRecord(schema)) return null;

  if (Array.isArray(schema.enum) && schema.enum.length > 0)
    return schema.enum[0];
  if ('default' in schema) return schema.default;
  if (Array.isArray(schema.examples) && schema.examples.length > 0) {
    return schema.examples[0];
  }
  if ('example' in schema) return schema.example;

  const types = Array.isArray(schema.type)
    ? (schema.type as unknown[])
    : [schema.type];

  if (types.includes('object') || isRecord(schema.properties)) {
    const required = asArray(schema.required).filter(
      (key): key is string => typeof key === 'string'
    );
    const properties = isRecord(schema.properties) ? schema.properties : {};
    const out: Record<string, unknown> = {};
    for (const key of required) {
      out[key] = buildFromSchema(properties[key], depth + 1);
    }
    return out;
  }

  if (types.includes('array')) {
    const minItems =
      typeof schema.minItems === 'number' && schema.minItems > 0
        ? schema.minItems
        : 1;
    return Array.from({ length: minItems }, () =>
      buildFromSchema(schema.items, depth + 1)
    );
  }

  if (types.includes('string')) return sampleString(schema);
  if (types.includes('integer')) return sampleNumber(schema, true);
  if (types.includes('number')) return sampleNumber(schema, false);
  if (types.includes('boolean')) return false;
  if (types.includes('null')) return null;

  const branches = schema.anyOf ?? schema.oneOf ?? schema.allOf;
  if (Array.isArray(branches) && branches.length > 0) {
    return buildFromSchema(branches[0], depth + 1);
  }

  return {};
}

/**
 * `inputSchema` from `@agentcash/discovery` may be either:
 *   - A bare JSON Schema (when the OpenAPI operation has only a requestBody), or
 *   - `{ requestBody?, parameters? }` (when parameters are also present).
 *
 * Returns `undefined` when the schema doesn't yield a usable object body.
 */
export function buildSampleBodyFromInputSchema(
  inputSchema: unknown
): Record<string, unknown> | undefined {
  if (!isRecord(inputSchema)) return undefined;

  const wrapped =
    !('type' in inputSchema) &&
    !('properties' in inputSchema) &&
    ('requestBody' in inputSchema || 'parameters' in inputSchema);

  const target = wrapped ? inputSchema.requestBody : inputSchema;
  if (!isRecord(target)) return undefined;

  const sample = buildFromSchema(target, 0);
  return isRecord(sample) ? sample : undefined;
}
