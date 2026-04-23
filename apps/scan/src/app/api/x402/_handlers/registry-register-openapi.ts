import { jsonResponse } from '@/app/api/x402/_lib/utils';
import { registerResource } from '@/lib/resources';
import { convertOpenApiSchemaToV1 } from '@/lib/openapi-to-v1';
import type { EndpointMethodAdvisory } from '@agentcash/discovery';

interface OpenApiSpec {
  openapi?: string;
  swagger?: string;
  paths?: Record<string, Record<string, OpenApiOperation>>;
  servers?: Array<{ url: string }>;
}

interface OpenApiOperation {
  summary?: string;
  description?: string;
  'x-402'?: X402Config;
  'x402'?: X402Config;
  parameters?: OpenApiParameter[];
  requestBody?: {
    content?: Record<string, { schema?: Record<string, unknown> }>;
  };
  responses?: Record<string, OpenApiResponse>;
}

interface X402Config {
  enabled?: boolean;
  price?: {
    amount?: string | number;
    asset?: string;
    network?: string;
  };
  paymentRequirements?: Record<string, unknown>;
}

interface OpenApiParameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  schema?: Record<string, unknown>;
  required?: boolean;
  description?: string;
}

interface OpenApiResponse {
  description?: string;
  content?: Record<string, { schema?: Record<string, unknown> }>;
}

interface ExtractedResource {
  url: string;
  method: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  x402Config: X402Config;
}

/**
 * Extract x402-enabled resources from an OpenAPI specification.
 * Looks for endpoints with `x-402` or `x402` extension fields.
 */
function extractX402Resources(
  spec: OpenApiSpec,
  baseUrl?: string
): ExtractedResource[] {
  const resources: ExtractedResource[] = [];

  if (!spec.paths) return resources;

  const serverUrl = baseUrl ?? spec.servers?.[0]?.url ?? '';

  for (const [path, methods] of Object.entries(spec.paths)) {
    if (!methods) continue;

    for (const [method, operation] of Object.entries(methods)) {
      if (method.startsWith('x-') || method === 'parameters') continue;

      const op = operation as OpenApiOperation;
      const x402Config = op['x-402'] ?? op['x402'];

      if (!x402Config?.enabled && !x402Config?.paymentRequirements) continue;

      const fullUrl = serverUrl
        ? `${serverUrl.replace(/\/$/, '')}${path}`
        : path;

      // Build input schema from operation parameters and request body
      const inputSchema: Record<string, unknown> = {};

      if (op.parameters && op.parameters.length > 0) {
        inputSchema.parameters = op.parameters;
      }

      if (op.requestBody?.content) {
        const jsonContent =
          op.requestBody.content['application/json'] ??
          Object.values(op.requestBody.content)[0];
        if (jsonContent?.schema) {
          inputSchema.requestBody = jsonContent.schema;
        }
      }

      // Build output schema from responses
      let outputSchema: Record<string, unknown> | undefined;
      const successResponse =
        op.responses?.['200'] ??
        op.responses?.['201'] ??
        op.responses?.['default'];
      if (successResponse?.content) {
        const jsonContent =
          successResponse.content['application/json'] ??
          Object.values(successResponse.content)[0];
        if (jsonContent?.schema) {
          outputSchema = jsonContent.schema;
        }
      }

      resources.push({
        url: fullUrl,
        method: method.toUpperCase(),
        inputSchema,
        outputSchema,
        x402Config,
      });
    }
  }

  return resources;
}

/**
 * Build an EndpointMethodAdvisory from an extracted resource and x402 config.
 * This creates the advisory structure that registerResource expects.
 */
function buildAdvisory(
  resource: ExtractedResource
): EndpointMethodAdvisory {
  const price = resource.x402Config.price ?? {};

  const paymentOption = {
    protocol: 'x402' as const,
    scheme: 'exact' as const,
    network: price.network ?? 'base',
    amount: String(price.amount ?? '0'),
    maxAmountRequired: String(price.amount ?? '0'),
    payTo: '',
    asset: price.asset,
    version: 1,
  };

  return {
    method: resource.method as EndpointMethodAdvisory['method'],
    inputSchema: resource.inputSchema,
    outputSchema: resource.outputSchema,
    paymentOptions: [paymentOption],
    paymentRequiredBody: {
      x402Version: 1,
      accepts: [paymentOption],
      error: '',
    },
  } as unknown as EndpointMethodAdvisory;
}

export interface OpenApiRegisterResult {
  success: boolean;
  registered: number;
  total: number;
  failed: number;
  failedDetails: Array<{ url: string; error: string }>;
  resources: Array<{
    url: string;
    method: string;
    success: boolean;
    error?: string;
  }>;
}

export async function handleRegistryRegisterOpenApi(
  specInput: OpenApiSpec | string,
  baseUrl?: string
): Promise<ReturnType<typeof jsonResponse>> {
  let spec: OpenApiSpec;

  try {
    spec = typeof specInput === 'string' ? JSON.parse(specInput) : specInput;
  } catch {
    return jsonResponse(
      {
        success: false,
        error: 'Invalid JSON in OpenAPI specification',
      },
      400
    );
  }

  // Validate it looks like an OpenAPI spec
  if (!spec.openapi && !spec.swagger) {
    return jsonResponse(
      {
        success: false,
        error:
          'Not a valid OpenAPI specification (missing openapi or swagger field)',
      },
      400
    );
  }

  const extracted = extractX402Resources(spec, baseUrl);

  if (extracted.length === 0) {
    return jsonResponse(
      {
        success: false,
        error:
          'No x402-enabled endpoints found. Add x-402: { enabled: true } to your endpoint operations.',
      },
      404
    );
  }

  const results: OpenApiRegisterResult = {
    success: true,
    registered: 0,
    total: extracted.length,
    failed: 0,
    failedDetails: [],
    resources: [],
  };

  for (const resource of extracted) {
    try {
      const advisory = buildAdvisory(resource);
      const result = await registerResource(resource.url, advisory);

      if (result.success) {
        results.registered++;
        results.resources.push({
          url: resource.url,
          method: resource.method,
          success: true,
        });
      } else {
        results.failed++;
        const errorMsg =
          result.error.type === 'parseResponse'
            ? result.error.parseErrors.join(', ')
            : JSON.stringify(result.error);
        results.failedDetails.push({ url: resource.url, error: errorMsg });
        results.resources.push({
          url: resource.url,
          method: resource.method,
          success: false,
          error: errorMsg,
        });
      }
    } catch (err) {
      results.failed++;
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      results.failedDetails.push({ url: resource.url, error: errorMsg });
      results.resources.push({
        url: resource.url,
        method: resource.method,
        success: false,
        error: errorMsg,
      });
    }
  }

  results.success = results.registered > 0;

  return jsonResponse(results);
}
