import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { registerResource } from '@/lib/resources';
import { probeX402Endpoint } from '@/lib/discovery/probe';

const openApiInputSchema = z.object({
  /** Raw OpenAPI spec as a JSON object or YAML string */
  spec: z.unknown(),
  /** Base URL to prepend to relative paths (required if spec has no servers) */
  baseUrl: z.string().url().optional(),
  /** If true, only parse and return endpoints without registering */
  dryRun: z.boolean().optional().default(false),
});

type ExtractedEndpoint = {
  url: string;
  method: string;
  summary?: string;
  operationId?: string;
};

/**
 * POST /api/resources/register-from-openapi
 *
 * Upload an OpenAPI 3.x spec (JSON) to extract endpoints and register
 * them as x402 resources in batch.
 *
 * Body:
 *   {
 *     "spec": { ... openapi json ... },
 *     "baseUrl": "https://example.com",  // optional override
 *     "dryRun": false                     // optional, default false
 *   }
 */
export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const input = openApiInputSchema.parse(body);

    const spec = input.spec as Record<string, unknown>;

    // Validate it looks like an OpenAPI spec
    const openApiVersion =
      (spec.openapi as string) ?? (spec.swagger as string);
    if (!openApiVersion) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: 'validation',
            message:
              'Invalid OpenAPI spec: missing "openapi" or "swagger" version field',
          },
        },
        { status: 400 }
      );
    }

    // Extract base URL from spec servers or use provided override
    const baseUrl = resolveBaseUrl(spec, input.baseUrl);
    if (!baseUrl) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: 'validation',
            message:
              'Could not determine base URL. Provide "baseUrl" or ensure spec has "servers" defined.',
          },
        },
        { status: 400 }
      );
    }

    // Extract endpoints from paths
    const endpoints = extractEndpoints(spec, baseUrl);

    if (endpoints.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: 'validation',
            message: 'No endpoints found in the OpenAPI spec',
          },
        },
        { status: 400 }
      );
    }

    // Dry run — just return extracted endpoints
    if (input.dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        baseUrl,
        openApiVersion,
        endpointCount: endpoints.length,
        endpoints,
      });
    }

    // Register endpoints with rate limiting
    const results = await registerEndpoints(endpoints);

    const registered = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return NextResponse.json({
      success: true,
      baseUrl,
      openApiVersion,
      registered: registered.length,
      failed: failed.length,
      total: endpoints.length,
      results,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: 'validation',
            issues: error.issues.map(i => ({
              path: i.path.join('.'),
              message: i.message,
            })),
          },
        },
        { status: 400 }
      );
    }

    console.error('OpenAPI registration failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          type: 'internal',
          message:
            error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
};

// ===== Internal helpers =====

function resolveBaseUrl(
  spec: Record<string, unknown>,
  override?: string
): string | null {
  if (override) return override.replace(/\/+$/, '');

  const servers = spec.servers as Array<{ url?: string }> | undefined;
  if (servers && servers.length > 0 && servers[0]?.url) {
    return servers[0].url.replace(/\/+$/, '');
  }

  // Swagger 2.0 fallback
  const host = spec.host as string | undefined;
  const basePath = (spec.basePath as string) ?? '';
  const schemes = (spec.schemes as string[]) ?? ['https'];
  if (host) {
    return `${schemes[0]}://${host}${basePath}`.replace(/\/+$/, '');
  }

  return null;
}

const HTTP_METHODS = [
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'head',
  'options',
] as const;

function extractEndpoints(
  spec: Record<string, unknown>,
  baseUrl: string
): ExtractedEndpoint[] {
  const paths = spec.paths as Record<
    string,
    Record<string, unknown>
  > | null;
  if (!paths) return [];

  const endpoints: ExtractedEndpoint[] = [];

  for (const [path, methods] of Object.entries(paths)) {
    if (!methods || typeof methods !== 'object') continue;

    for (const method of HTTP_METHODS) {
      const operation = methods[method] as Record<string, unknown> | undefined;
      if (!operation) continue;

      const fullUrl = `${baseUrl}${path}`;

      endpoints.push({
        url: fullUrl,
        method: method.toUpperCase(),
        summary: (operation.summary as string) ?? undefined,
        operationId: (operation.operationId as string) ?? undefined,
      });
    }
  }

  return endpoints;
}

const RATE_LIMIT_DELAY_MS = 200;

async function registerEndpoints(
  endpoints: ExtractedEndpoint[]
): Promise<
  Array<{
    url: string;
    method: string;
    success: boolean;
    resourceId?: string;
    error?: string;
  }>
> {
  const results = [];

  for (const endpoint of endpoints) {
    try {
      const probeResult = await probeX402Endpoint(
        endpoint.url.replaceAll('{', '').replaceAll('}', ''),
        endpoint.method
      );

      if (!probeResult.success) {
        results.push({
          url: endpoint.url,
          method: endpoint.method,
          success: false,
          error: `No 402 response (${probeResult.error ?? 'unknown'})`,
        });
        continue;
      }

      const result = await registerResource(
        endpoint.url,
        probeResult.advisory
      );

      if (!result.success) {
        results.push({
          url: endpoint.url,
          method: endpoint.method,
          success: false,
          error:
            result.error.type === 'parseResponse'
              ? result.error.parseErrors.join(', ')
              : JSON.stringify(result.error),
        });
      } else {
        results.push({
          url: endpoint.url,
          method: endpoint.method,
          success: true,
          resourceId: result.resource.resource.id,
        });
      }
    } catch (error) {
      results.push({
        url: endpoint.url,
        method: endpoint.method,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Rate limit between requests
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
  }

  return results;
}
