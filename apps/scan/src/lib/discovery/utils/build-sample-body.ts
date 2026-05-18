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
const SAMPLE_EVM_ADDRESS = '0x0000000000000000000000000000000000000000';

type JsonSchema = Record<string, unknown>;

function isRecord(value: unknown): value is JsonSchema {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function descriptionOf(schema: unknown): string | undefined {
  return isRecord(schema) && typeof schema.description === 'string'
    ? schema.description
    : undefined;
}

function buildFromSchema(
  schema: unknown,
  depth: number,
  propertyName?: string,
  parentDescription?: string
): unknown {
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
      out[key] = buildFromSchema(properties[key], depth + 1, key);
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
      buildFromSchema(
        schema.items,
        depth + 1,
        propertyName,
        descriptionOf(schema)
      )
    );
  }

  if (types.includes('string'))
    return pickString(schema, propertyName, parentDescription);
  if (types.includes('integer')) return pickNumber(schema, true);
  if (types.includes('number')) return pickNumber(schema, false);
  if (types.includes('boolean')) return false;
  if (types.includes('null')) return null;

  const branches = schema.anyOf ?? schema.oneOf ?? schema.allOf;
  if (Array.isArray(branches) && branches.length > 0) {
    return buildFromSchema(
      branches[0],
      depth + 1,
      propertyName,
      parentDescription
    );
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
 * Picks a string value honoring `const`, `format`, `pattern`, and `min/maxLength`.
 *
 * For `pattern` constraints: attempts to generate a minimal matching string
 * via `sampleFromPattern`. Complex patterns (lookaheads, backrefs) that the
 * generator can't handle fall through gracefully — same as today.
 */
function pickString(
  schema: JsonSchema,
  propertyName?: string,
  parentDescription?: string
): string {
  const format = typeof schema.format === 'string' ? schema.format : undefined;
  const pattern =
    typeof schema.pattern === 'string' ? schema.pattern : undefined;
  const minLength =
    typeof schema.minLength === 'number' ? schema.minLength : undefined;
  const maxLength =
    typeof schema.maxLength === 'number' ? schema.maxLength : undefined;
  const description = descriptionOf(schema) ?? parentDescription;

  let value =
    sampleByFormat(format, propertyName, description) ??
    sampleByName(propertyName) ??
    sampleFromPattern(pattern) ??
    'sample';

  if (pattern && !safeRegexTest(pattern, value)) {
    value = sampleFromPattern(pattern) ?? value;
  }

  if (minLength !== undefined && value.length < minLength) {
    value = value.padEnd(minLength, 'x');
  }
  if (maxLength !== undefined && value.length > maxLength) {
    value = value.slice(0, maxLength);
  }
  return value;
}

function sampleByName(propertyName: string | undefined): string | undefined {
  if (!propertyName) return undefined;
  const lower = propertyName.toLowerCase();
  if (lower === 'address') return SAMPLE_EVM_ADDRESS;
  if (/^(hostname|domain|host)$/.test(lower)) return 'example.com';
  return undefined;
}

function safeRegexTest(pattern: string, value: string): boolean {
  try {
    return new RegExp(pattern).test(value);
  } catch {
    return false;
  }
}

/**
 * Generates a minimal string that satisfies a regex pattern by walking its
 * tokens and emitting the simplest matching character for each.
 *
 * Handles: literals, \d \w \s, character classes [A-Z], quantifiers {N,M},
 * +, *, ?, groups (?:...) and (...), anchors ^$, and escaped chars.
 *
 * Returns `undefined` for patterns it can't parse (lookaheads, backrefs, etc.)
 * — the caller falls through to the default `'sample'` value.
 */
function sampleFromPattern(pattern: string | undefined): string | undefined {
  if (!pattern) return undefined;
  try {
    const result = emitPattern(pattern, 0);
    if (!result) return undefined;
    const candidate = result.value;
    return safeRegexTest(pattern, candidate) ? candidate : undefined;
  } catch {
    return undefined;
  }
}

type EmitResult = { value: string; pos: number } | undefined;

function emitPattern(pattern: string, start: number): EmitResult {
  let pos = start;
  let out = '';

  while (pos < pattern.length) {
    const ch = pattern[pos]!;

    if (ch === '$') {
      pos++;
      continue;
    }
    if (ch === '^') {
      pos++;
      continue;
    }

    // End of group
    if (ch === ')') break;

    // Alternation — stop this branch (we already have left side)
    if (ch === '|') break;

    // Groups: (?:...) or (...)
    if (ch === '(') {
      pos++; // skip (
      if (pattern[pos] === '?' && pattern[pos + 1] === ':') {
        pos += 2; // skip ?:
      } else if (pattern[pos] === '?') {
        // Lookahead/lookbehind — bail
        return undefined;
      }
      const inner = emitPattern(pattern, pos);
      if (!inner) return undefined;
      const groupValue = inner.value;
      pos = inner.pos;
      if (pattern[pos] === ')') pos++;

      const quant = parseQuantifier(pattern, pos);
      out += groupValue.repeat(quant.min);
      pos = quant.pos;
      continue;
    }

    // Character class [...]
    if (ch === '[') {
      const cls = parseCharClass(pattern, pos);
      if (!cls) return undefined;
      const quant = parseQuantifier(pattern, cls.pos);
      out += cls.char.repeat(quant.min);
      pos = quant.pos;
      continue;
    }

    // Escape sequences
    if (ch === '\\') {
      const next = pattern[pos + 1];
      if (!next) return undefined;
      let emitted: string;
      switch (next) {
        case 'd':
          emitted = '0';
          break;
        case 'D':
          emitted = 'a';
          break;
        case 'w':
          emitted = 'a';
          break;
        case 'W':
          emitted = '-';
          break;
        case 's':
          emitted = ' ';
          break;
        case 'S':
          emitted = 'a';
          break;
        default:
          emitted = next;
          break; // literal escape: \+, \., etc.
      }
      pos += 2;
      const quant = parseQuantifier(pattern, pos);
      out += emitted.repeat(quant.min);
      pos = quant.pos;
      continue;
    }

    // Dot — match any
    if (ch === '.') {
      pos++;
      const quant = parseQuantifier(pattern, pos);
      out += 'a'.repeat(quant.min);
      pos = quant.pos;
      continue;
    }

    // Literal character
    pos++;
    const quant = parseQuantifier(pattern, pos);
    out += ch.repeat(quant.min);
    pos = quant.pos;
  }

  return { value: out, pos };
}

function parseQuantifier(
  pattern: string,
  pos: number
): { min: number; pos: number } {
  if (pos >= pattern.length) return { min: 1, pos };
  const ch = pattern[pos]!;

  if (ch === '*') return { min: 0, pos: pos + 1 };
  if (ch === '?') return { min: 0, pos: pos + 1 };
  if (ch === '+') return { min: 1, pos: pos + 1 };

  if (ch === '{') {
    const close = pattern.indexOf('}', pos);
    if (close === -1) return { min: 1, pos };
    const inner = pattern.slice(pos + 1, close);
    const parts = inner.split(',');
    const min = parseInt(parts[0]!, 10);
    return { min: isNaN(min) ? 1 : min, pos: close + 1 };
  }

  return { min: 1, pos };
}

function parseCharClass(
  pattern: string,
  start: number
): { char: string; pos: number } | undefined {
  let pos = start + 1; // skip [
  const negated = pattern[pos] === '^';
  if (negated) pos++;

  let firstChar: string | undefined;
  while (pos < pattern.length && pattern[pos] !== ']') {
    const ch = pattern[pos]!;
    if (ch === '\\' && pos + 1 < pattern.length) {
      const next = pattern[pos + 1]!;
      if (!firstChar) {
        switch (next) {
          case 'd':
            firstChar = '0';
            break;
          case 'w':
            firstChar = 'a';
            break;
          case 's':
            firstChar = ' ';
            break;
          default:
            firstChar = next;
            break;
        }
      }
      pos += 2;
    } else {
      firstChar ??= ch;
      pos++;
    }
  }
  if (pattern[pos] === ']') pos++;

  if (negated) {
    // For negated classes, find a printable ASCII char not in the set
    // Simple heuristic: if the class negates digits, use 'a'; otherwise use '0'
    return { char: firstChar === '0' ? 'a' : '0', pos };
  }

  return firstChar ? { char: firstChar, pos } : undefined;
}

const SAMPLE_IMAGE_URL = 'https://placehold.co/1x1.png';

const MEDIA_HINT = /image|img|photo|picture|thumbnail|avatar|icon|logo/i;

function sampleUriForProperty(
  name: string | undefined,
  description: string | undefined
): string | undefined {
  if (name && MEDIA_HINT.test(name)) return SAMPLE_IMAGE_URL;
  if (description && MEDIA_HINT.test(description)) return SAMPLE_IMAGE_URL;
  return undefined;
}

function sampleByFormat(
  format: string | undefined,
  propertyName?: string,
  description?: string
): string | undefined {
  switch (format) {
    case 'email':
    case 'idn-email':
      return 'user@example.com';
    case 'uri':
    case 'iri':
    case 'uri-reference':
    case 'iri-reference':
    case 'url':
      return (
        sampleUriForProperty(propertyName, description) ?? 'https://example.com'
      );
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

/**
 * Extracts required query parameters from an OpenAPI-style `inputSchema` and
 * builds sample values for each. Used by the probe to append query params to
 * the URL for GET endpoints that validate params before the paywall.
 *
 * The `parameters` field is an array of OpenAPI parameter objects:
 *   [{ in: "query", name: "hostname", schema: { type: "string", ... }, required: true }]
 */
export function buildSampleQueryParams(
  inputSchema: unknown
): Record<string, string> | undefined {
  if (!isRecord(inputSchema)) return undefined;
  const params = inputSchema.parameters;
  if (!Array.isArray(params)) return undefined;

  const queryParams: Record<string, string> = {};
  for (const param of params) {
    if (!isRecord(param)) continue;
    if (param.in !== 'query' || !param.required) continue;

    const name = typeof param.name === 'string' ? param.name : undefined;
    const schema = isRecord(param.schema) ? param.schema : undefined;
    if (!name || !schema) continue;

    const value = buildFromSchema(schema, 0, name);
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      queryParams[name] = String(value);
    }
  }

  return Object.keys(queryParams).length > 0 ? queryParams : undefined;
}
