/**
 * OpenAPI spec parser for extracting resource endpoints.
 *
 * Parses OpenAPI 3.x specs (JSON or YAML) and extracts endpoints
 * with their methods, parameters, and request/response schemas.
 */

export interface ParsedEndpoint {
  /** Full URL for this endpoint (baseUrl + path) */
  url: string;
  /** HTTP method (GET, POST, PUT, PATCH, DELETE) */
  method: string;
  /** Path from the spec (e.g. /api/v1/generate) */
  path: string;
  /** Operation summary or description */
  description: string | null;
  /** Operation ID if available */
  operationId: string | null;
  /** Query parameters */
  queryParams: Record<string, FieldDef>;
  /** Request body fields (for POST/PUT/PATCH) */
  bodyFields: Record<string, FieldDef>;
  /** Response schema (if available) */
  responseSchema: Record<string, unknown> | null;
}

export interface FieldDef {
  type?: string;
  required?: boolean;
  description?: string;
  enum?: string[];
  properties?: Record<string, FieldDef>;
  items?: FieldDef;
}

export interface ParseSpecResult {
  success: true;
  title: string | null;
  description: string | null;
  version: string | null;
  baseUrl: string;
  endpoints: ParsedEndpoint[];
}

export interface ParseSpecError {
  success: false;
  error: string;
}

/**
 * Attempt to parse a string as JSON first.
 * If that fails, do a basic YAML-like parse for common OpenAPI structures.
 */
function parseContent(content: string): unknown {
  // Try JSON first
  try {
    return JSON.parse(content);
  } catch {
    // Not JSON, continue
  }

  // Try a minimal YAML parse for the subset used by OpenAPI specs
  try {
    return parseSimpleYaml(content);
  } catch {
    // Not parseable
  }

  throw new Error(
    'Could not parse spec content. Please provide valid JSON or YAML.'
  );
}

/**
 * Minimal YAML parser that handles the subset commonly used by OpenAPI specs.
 */
function parseSimpleYaml(content: string): unknown {
  const lines = content.split('\n');
  return parseYamlLines(lines, 0, 0).value;
}

interface YamlResult {
  value: unknown;
  nextIndex: number;
}

function parseYamlLines(
  lines: string[],
  startIndex: number,
  minIndent: number
): YamlResult {
  const result: Record<string, unknown> = {};
  let i = startIndex;

  while (i < lines.length) {
    const line = lines[i]!;
    const trimmed = line.trimStart();

    if (trimmed === '' || trimmed.startsWith('#')) {
      i++;
      continue;
    }

    const indent = line.length - trimmed.length;
    if (indent < minIndent) break;

    // Handle list items
    if (trimmed.startsWith('- ')) {
      const arr: unknown[] = [];
      while (i < lines.length) {
        const arrLine = lines[i]!;
        const arrTrimmed = arrLine.trimStart();
        const arrIndent = arrLine.length - arrTrimmed.length;

        if (arrTrimmed === '' || arrTrimmed.startsWith('#')) {
          i++;
          continue;
        }
        if (arrIndent < indent) break;
        if (!arrTrimmed.startsWith('- ')) break;

        const val = arrTrimmed.slice(2).trim();
        arr.push(parseYamlValue(val));
        i++;
      }
      return { value: arr, nextIndex: i };
    }

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) {
      i++;
      continue;
    }

    const key = trimmed.slice(0, colonIdx).trim();
    const afterColon = trimmed.slice(colonIdx + 1).trim();

    if (afterColon === '' || afterColon === '|' || afterColon === '>') {
      const nextNonEmpty = findNextNonEmpty(lines, i + 1);
      if (nextNonEmpty !== null) {
        const nextLine = lines[nextNonEmpty]!;
        const nextIndent = nextLine.length - nextLine.trimStart().length;
        if (nextIndent > indent) {
          const nested = parseYamlLines(lines, nextNonEmpty, nextIndent);
          result[key] = nested.value;
          i = nested.nextIndex;
        } else {
          result[key] = null;
          i++;
        }
      } else {
        result[key] = null;
        i++;
      }
    } else {
      result[key] = parseYamlValue(afterColon);
      i++;
    }
  }

  return { value: result, nextIndex: i };
}

function findNextNonEmpty(lines: string[], start: number): number | null {
  for (let i = start; i < lines.length; i++) {
    const trimmed = lines[i]!.trim();
    if (trimmed !== '' && !trimmed.startsWith('#')) return i;
  }
  return null;
}

function parseYamlValue(val: string): unknown {
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (val === 'null' || val === '~') return null;

  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    return val.slice(1, -1);
  }

  if (val.startsWith('[') && val.endsWith(']')) {
    return val
      .slice(1, -1)
      .split(',')
      .map(s => parseYamlValue(s.trim()));
  }

  const num = Number(val);
  if (!isNaN(num) && val !== '') return num;

  return val;
}

/**
 * Extract the base URL from the OpenAPI spec servers array.
 */
function extractBaseUrl(
  spec: Record<string, unknown>,
  fallbackBaseUrl?: string
): string {
  const servers = spec.servers;
  if (Array.isArray(servers) && servers.length > 0) {
    const first = servers[0] as Record<string, unknown>;
    if (typeof first.url === 'string') {
      let url = first.url;
      const variables = first.variables as
        | Record<string, { default?: string }>
        | undefined;
      if (variables) {
        for (const [varName, varDef] of Object.entries(variables)) {
          if (varDef.default) {
            url = url.replace(`{${varName}}`, varDef.default);
          }
        }
      }
      if (url.startsWith('/') && fallbackBaseUrl) {
        return fallbackBaseUrl.replace(/\/+$/, '') + url;
      }
      return url.replace(/\/+$/, '');
    }
  }
  return fallbackBaseUrl?.replace(/\/+$/, '') ?? '';
}

/**
 * Resolve a $ref path in the spec.
 */
function resolveRef(
  spec: Record<string, unknown>,
  ref: string
): Record<string, unknown> | null {
  if (!ref.startsWith('#/')) return null;
  const parts = ref.slice(2).split('/');
  let current: unknown = spec;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return null;
    }
  }
  return current as Record<string, unknown> | null;
}

/**
 * Convert an OpenAPI schema object to our FieldDef format.
 */
function schemaToFieldDef(
  spec: Record<string, unknown>,
  schema: Record<string, unknown>,
  requiredFields?: string[],
  fieldName?: string,
  depth = 0
): FieldDef {
  if (depth > 10) return { type: 'object' };

  let resolved = schema;
  if (typeof schema.$ref === 'string') {
    const refResolved = resolveRef(spec, schema.$ref);
    if (refResolved) resolved = refResolved;
    else return { type: 'object', description: `Unresolved: ${schema.$ref}` };
  }

  const field: FieldDef = {};

  if (typeof resolved.type === 'string') {
    field.type = resolved.type;
  }

  if (typeof resolved.description === 'string') {
    field.description = resolved.description;
  }

  if (Array.isArray(resolved.enum)) {
    field.enum = resolved.enum.map(String);
  }

  if (fieldName && requiredFields?.includes(fieldName)) {
    field.required = true;
  }

  if (resolved.properties && typeof resolved.properties === 'object') {
    const props: Record<string, FieldDef> = {};
    const nestedRequired = Array.isArray(resolved.required)
      ? (resolved.required as string[])
      : [];
    for (const [propName, propSchema] of Object.entries(
      resolved.properties as Record<string, Record<string, unknown>>
    )) {
      props[propName] = schemaToFieldDef(
        spec,
        propSchema,
        nestedRequired,
        propName,
        depth + 1
      );
    }
    field.properties = props;
    if (!field.type) field.type = 'object';
  }

  if (resolved.items && typeof resolved.items === 'object') {
    field.items = schemaToFieldDef(
      spec,
      resolved.items as Record<string, unknown>,
      undefined,
      undefined,
      depth + 1
    );
    if (!field.type) field.type = 'array';
  }

  return field;
}

/**
 * Extract parameters from an operation.
 */
function extractParams(
  spec: Record<string, unknown>,
  parameters: unknown[]
): {
  queryParams: Record<string, FieldDef>;
} {
  const queryParams: Record<string, FieldDef> = {};

  for (const param of parameters) {
    let resolved = param as Record<string, unknown>;

    if (typeof resolved.$ref === 'string') {
      const ref = resolveRef(spec, resolved.$ref);
      if (ref) resolved = ref;
      else continue;
    }

    const name = resolved.name as string;
    const location = resolved.in as string;
    const schema = (resolved.schema as Record<string, unknown>) ?? {};
    const isRequired = resolved.required === true;

    const fieldDef = schemaToFieldDef(spec, schema);
    fieldDef.required = isRequired;
    if (typeof resolved.description === 'string') {
      fieldDef.description = resolved.description;
    }

    if (location === 'query') {
      queryParams[name] = fieldDef;
    }
  }

  return { queryParams };
}

/**
 * Extract request body fields from an operation.
 */
function extractBodyFields(
  spec: Record<string, unknown>,
  requestBody: Record<string, unknown>
): Record<string, FieldDef> {
  let resolved = requestBody;
  if (typeof resolved.$ref === 'string') {
    const ref = resolveRef(spec, resolved.$ref);
    if (ref) resolved = ref;
    else return {};
  }

  const content = resolved.content as Record<string, unknown> | undefined;
  if (!content) return {};

  const jsonContent = (content['application/json'] ??
    content['application/x-www-form-urlencoded'] ??
    Object.values(content)[0]) as Record<string, unknown> | undefined;

  if (!jsonContent?.schema) return {};

  const schema = jsonContent.schema as Record<string, unknown>;

  let resolvedSchema = schema;
  if (typeof schema.$ref === 'string') {
    const ref = resolveRef(spec, schema.$ref);
    if (ref) resolvedSchema = ref;
    else return {};
  }

  const properties = resolvedSchema.properties as
    | Record<string, Record<string, unknown>>
    | undefined;
  if (!properties) return {};

  const required = Array.isArray(resolvedSchema.required)
    ? (resolvedSchema.required as string[])
    : [];

  const fields: Record<string, FieldDef> = {};
  for (const [name, propSchema] of Object.entries(properties)) {
    fields[name] = schemaToFieldDef(spec, propSchema, required, name);
  }

  return fields;
}

/**
 * Extract response schema from an operation.
 */
function extractResponseSchema(
  spec: Record<string, unknown>,
  responses: Record<string, unknown>
): Record<string, unknown> | null {
  const response = (responses['200'] ??
    responses['201'] ??
    responses['default']) as Record<string, unknown> | undefined;
  if (!response) return null;

  let resolved = response;
  if (typeof resolved.$ref === 'string') {
    const ref = resolveRef(spec, resolved.$ref);
    if (ref) resolved = ref;
    else return null;
  }

  const content = resolved.content as Record<string, unknown> | undefined;
  if (!content) return null;

  const jsonContent = (content['application/json'] ??
    Object.values(content)[0]) as Record<string, unknown> | undefined;
  if (!jsonContent?.schema) return null;

  const schema = jsonContent.schema as Record<string, unknown>;

  if (typeof schema.$ref === 'string') {
    return resolveRef(spec, schema.$ref);
  }

  return schema;
}

const SUPPORTED_METHODS = ['get', 'post', 'put', 'patch', 'delete'];

/**
 * Parse an OpenAPI spec string and extract endpoints.
 */
export function parseOpenAPISpec(
  content: string,
  baseUrl?: string
): ParseSpecResult | ParseSpecError {
  let spec: Record<string, unknown>;
  try {
    spec = parseContent(content) as Record<string, unknown>;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to parse spec',
    };
  }

  const openapi = spec.openapi ?? spec.swagger;
  if (!openapi) {
    return {
      success: false,
      error:
        'Not a valid OpenAPI spec. Missing "openapi" or "swagger" version field.',
    };
  }

  const info = spec.info as Record<string, unknown> | undefined;
  const title = (info?.title as string) ?? null;
  const description = (info?.description as string) ?? null;
  const version = (info?.version as string) ?? null;

  const specBaseUrl = extractBaseUrl(spec, baseUrl);

  const paths = spec.paths as Record<
    string,
    Record<string, unknown>
  > | null;
  if (!paths) {
    return {
      success: false,
      error: 'No paths found in the OpenAPI spec.',
    };
  }

  const endpoints: ParsedEndpoint[] = [];

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue;

    const pathParams = Array.isArray(pathItem.parameters)
      ? pathItem.parameters
      : [];

    for (const method of SUPPORTED_METHODS) {
      const operation = pathItem[method] as Record<string, unknown> | undefined;
      if (!operation) continue;

      const operationParams = Array.isArray(operation.parameters)
        ? operation.parameters
        : [];
      const allParams = [...pathParams, ...operationParams];

      const { queryParams } = extractParams(spec, allParams);

      const bodyFields = operation.requestBody
        ? extractBodyFields(
            spec,
            operation.requestBody as Record<string, unknown>
          )
        : {};

      const responseSchema = operation.responses
        ? extractResponseSchema(
            spec,
            operation.responses as Record<string, unknown>
          )
        : null;

      const summary = (operation.summary as string) ?? null;
      const opDescription = (operation.description as string) ?? null;

      endpoints.push({
        url: specBaseUrl + path,
        method: method.toUpperCase(),
        path,
        description: summary ?? opDescription,
        operationId: (operation.operationId as string) ?? null,
        queryParams,
        bodyFields,
        responseSchema,
      });
    }
  }

  if (endpoints.length === 0) {
    return {
      success: false,
      error: 'No endpoints found in the OpenAPI spec.',
    };
  }

  return {
    success: true,
    title,
    description,
    version,
    baseUrl: specBaseUrl,
    endpoints,
  };
}
