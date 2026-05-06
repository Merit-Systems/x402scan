/**
 * Builds a minimum-valid sample request body from an OpenAPI input schema.
 *
 * Used by probeX402Endpoint as a fallback when a no-body probe gets rejected
 * by request validation (e.g. HTTP 400) before the paywall middleware can
 * issue its 402 challenge. Walking the spec's required fields yields a body
 * that satisfies validation so the live 402 — including chain-level
 * payTo/asset/network details — is reachable.
 *
 * Honors JSON Schema constraints — numeric bounds, string length/format,
 * `const`, array bounds — so the generated body passes server-side
 * validators that go beyond required-field checks.
 */

const MAX_DEPTH = 8;

type JsonSchema = Record<string, unknown>;

function isRecord(value: unknown): value is JsonSchema {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function buildFromSchema(schema: unknown, depth: number): unknown {
  if (depth > MAX_DEPTH || !isRecord(schema)) return null;

  if ('const' in schema) return schema.const;
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
    const maxItems =
      typeof schema.maxItems === 'number' && schema.maxItems > 0
        ? schema.maxItems
        : Number.POSITIVE_INFINITY;
    const length = Math.min(minItems, maxItems);
    return Array.from({ length }, () =>
      buildFromSchema(schema.items, depth + 1)
    );
  }

  if (types.includes('string')) return pickString(schema);
  if (types.includes('integer')) return pickNumber(schema, true);
  if (types.includes('number')) return pickNumber(schema, false);
  if (types.includes('boolean')) return false;
  if (types.includes('null')) return null;

  const branches = schema.anyOf ?? schema.oneOf ?? schema.allOf;
  if (Array.isArray(branches) && branches.length > 0) {
    return buildFromSchema(branches[0], depth + 1);
  }

  return {};
}

/**
 * Picks a numeric value satisfying the schema's bounds.
 *
 * Handles both JSON Schema 2020-12 (`exclusiveMinimum`/`exclusiveMaximum` as
 * numbers) and pre-draft-06 (booleans paired with `minimum`/`maximum`).
 *
 * Strategy: derive the strictest lower bound, then snap up to a `multipleOf`
 * if present. If only an upper bound is constrained and 0 fails it, derive
 * from the upper instead.
 */
function pickNumber(schema: JsonSchema, isInteger: boolean): number {
  const minimum =
    typeof schema.minimum === 'number' ? schema.minimum : undefined;
  const maximum =
    typeof schema.maximum === 'number' ? schema.maximum : undefined;

  const rawExMin = schema.exclusiveMinimum;
  const rawExMax = schema.exclusiveMaximum;
  const exclusiveMinimum: number | undefined =
    typeof rawExMin === 'number'
      ? rawExMin
      : rawExMin === true && minimum !== undefined
        ? minimum
        : undefined;
  const exclusiveMaximum: number | undefined =
    typeof rawExMax === 'number'
      ? rawExMax
      : rawExMax === true && maximum !== undefined
        ? maximum
        : undefined;

  const multipleOf =
    typeof schema.multipleOf === 'number' && schema.multipleOf > 0
      ? schema.multipleOf
      : undefined;

  const stepUp = (n: number): number => {
    if (multipleOf !== undefined) {
      return (Math.floor(n / multipleOf) + 1) * multipleOf;
    }
    return isInteger ? Math.floor(n) + 1 : n + 1;
  };

  const stepDown = (n: number): number => {
    if (multipleOf !== undefined) {
      return (Math.ceil(n / multipleOf) - 1) * multipleOf;
    }
    return isInteger ? Math.ceil(n) - 1 : n - 1;
  };

  let candidate: number;
  if (
    exclusiveMinimum !== undefined &&
    (minimum === undefined || exclusiveMinimum >= minimum)
  ) {
    candidate = stepUp(exclusiveMinimum);
  } else if (minimum !== undefined) {
    candidate =
      multipleOf !== undefined
        ? Math.ceil(minimum / multipleOf) * multipleOf
        : minimum;
  } else if (exclusiveMaximum !== undefined && exclusiveMaximum <= 0) {
    candidate = stepDown(exclusiveMaximum);
  } else if (maximum !== undefined && maximum < 0) {
    candidate =
      multipleOf !== undefined
        ? Math.floor(maximum / multipleOf) * multipleOf
        : maximum;
  } else {
    candidate = multipleOf ?? 0;
  }

  if (isInteger) candidate = Math.trunc(candidate);
  return candidate;
}

/**
 * Picks a string value honoring `const`, `format`, and `min/maxLength`.
 *
 * `pattern` is intentionally not satisfied here — solving an arbitrary regex
 * is out of scope. If a server requires a `pattern`, the probe will fail and
 * the operator can register manually.
 */
function pickString(schema: JsonSchema): string {
  const format = typeof schema.format === 'string' ? schema.format : undefined;
  const minLength =
    typeof schema.minLength === 'number' ? schema.minLength : undefined;
  const maxLength =
    typeof schema.maxLength === 'number' ? schema.maxLength : undefined;

  let value = sampleByFormat(format) ?? 'sample';

  if (minLength !== undefined && value.length < minLength) {
    value = value.padEnd(minLength, 'x');
  }
  if (maxLength !== undefined && value.length > maxLength) {
    value = value.slice(0, maxLength);
  }
  return value;
}

function sampleByFormat(format: string | undefined): string | undefined {
  switch (format) {
    case 'email':
    case 'idn-email':
      return 'user@example.com';
    case 'uri':
    case 'iri':
    case 'uri-reference':
    case 'iri-reference':
    case 'url':
      return 'https://example.com';
    case 'uuid':
      return '00000000-0000-4000-8000-000000000000';
    case 'date':
      return '2025-01-01';
    case 'date-time':
      return '2025-01-01T00:00:00Z';
    case 'time':
      return '00:00:00';
    case 'ipv4':
      return '127.0.0.1';
    case 'ipv6':
      return '::1';
    case 'hostname':
    case 'idn-hostname':
      return 'example.com';
    default:
      return undefined;
  }
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
