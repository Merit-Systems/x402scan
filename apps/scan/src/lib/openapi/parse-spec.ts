import { z } from 'zod';

// ── Types ──────────────────────────────────────────────────────────────

export interface ParsedEndpoint {
  method: string;
  path: string;
  url: string;
  description: string | undefined;
  summary: string | undefined;
  parameters: ParsedParameter[];
  requestBody: unknown | undefined;
  responseSchema: unknown | undefined;
}

export interface ParsedParameter {
  name: string;
  in: string;
  required: boolean;
  description: string | undefined;
  schema: unknown | undefined;
}

export interface ParsedSpec {
  title: string | undefined;
  version: string | undefined;
  description: string | undefined;
  baseUrl: string | undefined;
  endpoints: ParsedEndpoint[];
}

// ── Input validation ───────────────────────────────────────────────────

export const openApiInputSchema = z.object({
  /** Raw OpenAPI spec as a JSON string or parsed object */
  spec: z.union([z.string().min(1), z.record(z.unknown())]),
  /** Override the base URL extracted from the spec */
  baseUrl: z.string().url().optional(),
});

export type OpenApiInput = z.infer<typeof openApiInputSchema>;

// ── Spec parsing ───────────────────────────────────────────────────────

const HTTP_METHODS = [
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'head',
  'options',
] as const;

function resolveRef(
  spec: Record<string, unknown>,
  ref: unknown
): unknown {
  if (
    typeof ref !== 'object' ||
    ref === null ||
    !('$ref' in ref) ||
    typeof (ref as Record<string, unknown>).$ref !== 'string'
  ) {
    return ref;
  }

  const refPath = ((ref as Record<string, unknown>).$ref as string).replace(
    /^#\//,
    ''
  );
  const parts = refPath.split('/');

  let current: unknown = spec;
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) return ref;
    current = (current as Record<string, unknown>)[part];
  }

  return current ?? ref;
}

function extractParameters(
  spec: Record<string, unknown>,
  rawParams: unknown
): ParsedParameter[] {
  if (!Array.isArray(rawParams)) return [];

  return rawParams
    .map(p => resolveRef(spec, p))
    .filter(
      (p): p is Record<string, unknown> =>
        typeof p === 'object' && p !== null && 'name' in p
    )
    .map(param => ({
      name: String(param.name),
      in: String(param.in ?? 'query'),
      required: Boolean(param.required),
      description:
        typeof param.description === 'string' ? param.description : undefined,
      schema: param.schema ? resolveRef(spec, param.schema) : undefined,
    }));
}

function extractResponseSchema(
  spec: Record<string, unknown>,
  responses: unknown
): unknown | undefined {
  if (typeof responses !== 'object' || responses === null) return undefined;

  const responsesObj = responses as Record<string, unknown>;
  const successKey =
    Object.keys(responsesObj).find(k => k === '200' || k === '201') ??
    Object.keys(responsesObj)[0];

  if (!successKey) return undefined;

  const response = resolveRef(spec, responsesObj[successKey]) as Record<
    string,
    unknown
  > | null;
  if (!response || typeof response !== 'object') return undefined;

  // OpenAPI 3.x: content -> application/json -> schema
  const content = response.content as Record<string, unknown> | undefined;
  if (content) {
    const jsonContent = (content['application/json'] ?? content['*/*']) as
      | Record<string, unknown>
      | undefined;
    if (jsonContent?.schema) {
      return resolveRef(spec, jsonContent.schema);
    }
  }

  // Swagger 2.x: schema directly on response
  if (response.schema) {
    return resolveRef(spec, response.schema);
  }

  return undefined;
}

function resolveBaseUrl(
  spec: Record<string, unknown>,
  overrideBaseUrl: string | undefined
): string | undefined {
  if (overrideBaseUrl) return overrideBaseUrl.replace(/\/$/, '');

  // OpenAPI 3.x servers
  const servers = spec.servers;
  if (Array.isArray(servers) && servers.length > 0) {
    const server = servers[0] as Record<string, unknown>;
    let url = String(server.url ?? '');

    // Handle server variables
    const variables = server.variables as
      | Record<string, Record<string, unknown>>
      | undefined;
    if (variables) {
      for (const [name, variable] of Object.entries(variables)) {
        const defaultValue = String(variable.default ?? '');
        url = url.replace(`{${name}}`, defaultValue);
      }
    }

    if (url && !url.startsWith('/')) return url.replace(/\/$/, '');
  }

  // Swagger 2.x
  const host = spec.host as string | undefined;
  if (host) {
    const schemes = (spec.schemes as string[]) ?? ['https'];
    const basePath = (spec.basePath as string) ?? '';
    return `${schemes[0]}://${host}${basePath}`.replace(/\/$/, '');
  }

  return undefined;
}

/**
 * Parse an OpenAPI 3.x or Swagger 2.x spec and extract all endpoints.
 */
export function parseOpenApiSpec(input: OpenApiInput): ParsedSpec {
  let spec: Record<string, unknown>;

  if (typeof input.spec === 'string') {
    const raw = input.spec.trim();

    try {
      spec = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new Error(
        'Invalid OpenAPI spec: could not parse as JSON. Please provide a valid JSON spec.'
      );
    }
  } else {
    spec = input.spec as Record<string, unknown>;
  }

  // Validate it looks like an OpenAPI/Swagger spec
  if (!spec.openapi && !spec.swagger) {
    throw new Error(
      'Invalid OpenAPI spec: missing "openapi" or "swagger" version field'
    );
  }

  if (!spec.paths || typeof spec.paths !== 'object') {
    throw new Error('Invalid OpenAPI spec: missing "paths" field');
  }

  const info = (spec.info ?? {}) as Record<string, unknown>;
  const baseUrl = resolveBaseUrl(spec, input.baseUrl);

  const paths = spec.paths as Record<string, Record<string, unknown>>;
  const endpoints: ParsedEndpoint[] = [];

  for (const [path, pathItem] of Object.entries(paths)) {
    if (typeof pathItem !== 'object' || pathItem === null) continue;

    const resolvedPath = resolveRef(spec, pathItem) as Record<string, unknown>;
    const pathLevelParams = resolvedPath.parameters;

    for (const method of HTTP_METHODS) {
      const operation = resolvedPath[method];
      if (!operation || typeof operation !== 'object') continue;

      const op = operation as Record<string, unknown>;

      // Merge path-level and operation-level parameters
      const opParams = extractParameters(spec, op.parameters);
      const pathParams = extractParameters(spec, pathLevelParams);
      const mergedParams = [
        ...pathParams.filter(
          pp => !opParams.some(op2 => op2.name === pp.name && op2.in === pp.in)
        ),
        ...opParams,
      ];

      const resolvedUrl = baseUrl ? `${baseUrl}${path}` : path;

      endpoints.push({
        method: method.toUpperCase(),
        path,
        url: resolvedUrl,
        description:
          typeof op.description === 'string' ? op.description : undefined,
        summary: typeof op.summary === 'string' ? op.summary : undefined,
        parameters: mergedParams,
        requestBody: op.requestBody
          ? resolveRef(spec, op.requestBody)
          : undefined,
        responseSchema: extractResponseSchema(spec, op.responses),
      });
    }
  }

  return {
    title: typeof info.title === 'string' ? info.title : undefined,
    version: typeof info.version === 'string' ? info.version : undefined,
    description:
      typeof info.description === 'string' ? info.description : undefined,
    baseUrl,
    endpoints,
  };
}
