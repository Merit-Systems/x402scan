import { discoverOriginSchema } from '@agentcash/discovery';
import { z } from 'zod';

import { endpointDescription } from '@/lib/discovery/endpoint-description';
import { getOriginFromUrl } from '@/lib/url';
import { isLocalUrl, isTunnelUrl } from '@/lib/url-helpers';
import { jsonValueSchema } from '@/lib/json';
import {
  isVercelPreviewDeployment,
  VERCEL_PREVIEW_ERROR_MESSAGE,
} from '@/lib/discovery/vercel-preview';

import type {
  DiscoveredResource,
  DiscoverySource,
  X402DiscoveryResult,
} from '@/types/discovery';

const FETCH_TIMEOUT_MS = 10000;

const registryOperationMetadataSchema = z.looseObject({
  'x-query-parameters-schema': jsonValueSchema.optional().catch(undefined),
  'x-x402scan-register': z.boolean().optional().catch(false),
});

const registryPathItemSchema = z.looseObject({
  get: registryOperationMetadataSchema.optional().catch(undefined),
  post: registryOperationMetadataSchema.optional().catch(undefined),
  put: registryOperationMetadataSchema.optional().catch(undefined),
  patch: registryOperationMetadataSchema.optional().catch(undefined),
  delete: registryOperationMetadataSchema.optional().catch(undefined),
  head: registryOperationMetadataSchema.optional().catch(undefined),
  options: registryOperationMetadataSchema.optional().catch(undefined),
  trace: registryOperationMetadataSchema.optional().catch(undefined),
});

const registryOpenApiMetadataSchema = z.looseObject({
  servers: z
    .array(
      z
        .looseObject({ url: z.string().optional().catch(undefined) })
        .optional()
        .catch(undefined)
    )
    .optional()
    .catch(undefined),
  paths: z
    .record(z.string(), registryPathItemSchema)
    .refine(paths => Object.keys(paths).length > 0),
});

type RegistryPathItem = z.infer<typeof registryPathItemSchema>;

function operationForMethod(
  pathItem: RegistryPathItem | undefined,
  method: string
) {
  switch (method.toUpperCase()) {
    case 'GET':
      return pathItem?.get;
    case 'POST':
      return pathItem?.post;
    case 'PUT':
      return pathItem?.put;
    case 'PATCH':
      return pathItem?.patch;
    case 'DELETE':
      return pathItem?.delete;
    case 'HEAD':
      return pathItem?.head;
    case 'OPTIONS':
      return pathItem?.options;
    case 'TRACE':
      return pathItem?.trace;
    default:
      return undefined;
  }
}

function normalizeDiscoveryPath(pathname: string) {
  const parsed = pathname.trim();
  if (parsed.length === 0 || parsed === '/') return '/';
  const pathOnly = parsed.split('?')[0]?.split('#')[0] ?? '/';
  const prefixed = pathOnly.startsWith('/') ? pathOnly : '/' + pathOnly;
  const normalized = prefixed.replace(/\/+/g, '/');
  return normalized !== '/' ? normalized.replace(/\/$/, '') : '/';
}

function openApiServerBasePath(
  document: z.infer<typeof registryOpenApiMetadataSchema>
) {
  const serverUrl = document.servers?.[0]?.url;
  if (!serverUrl) return '';
  try {
    const pathname = normalizeDiscoveryPath(new URL(serverUrl).pathname);
    return pathname === '/' ? '' : pathname;
  } catch {
    return '';
  }
}

function normalizedOpenApiPathMap(
  document: z.infer<typeof registryOpenApiMetadataSchema>
) {
  const basePath = openApiServerBasePath(document);
  return new Map(
    Object.entries(document.paths ?? {}).map(([rawPath, item]) => [
      normalizeDiscoveryPath(basePath + rawPath),
      item,
    ])
  );
}

function mapSourceToDiscoverySource(
  source: string | undefined
): DiscoverySource | undefined {
  if (source === 'openapi') return 'openapi';
  if (source === 'well-known/x402') return 'well-known';
  return undefined;
}

/**
 * Fetch discovery data for an origin using @agentcash/discovery.
 *
 * This attempts discovery via multiple methods:
 * openapi.json, /.well-known/x402, and probe-based discovery.
 */
export async function fetchDiscoveryDocument(
  originOrUrl: string,
  bustCache = false,
  requireOperationMetadata = false
): Promise<X402DiscoveryResult> {
  const origin = originOrUrl.includes('://')
    ? getOriginFromUrl(originOrUrl)
    : `https://${originOrUrl}`;

  if (isLocalUrl(origin)) {
    return {
      success: false,
      resources: [],

      error: 'Local URLs are not supported',
    };
  }

  if (isTunnelUrl(origin)) {
    return {
      success: false,
      resources: [],
      error:
        "Tunnel URLs are ephemeral and can't be reliably discovered by agents. Deploy your API to a permanent URL to register.",
    };
  }

  // Reject Vercel preview deployments — they serve `x-robots-tag: noindex`
  // and get torn down, so agents can't reliably reach them after registration.
  if (await isVercelPreviewDeployment(origin)) {
    return {
      success: false,
      resources: [],
      error: VERCEL_PREVIEW_ERROR_MESSAGE,
    };
  }

  const signal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
  const headers: Record<string, string> = bustCache
    ? { 'Cache-Control': 'no-cache, no-store' }
    : {};

  const discovered = await discoverOriginSchema({
    target: origin,
    headers,
    signal,
  });

  if (!discovered.found) {
    return {
      success: false,
      resources: [],

      error: discovered.message ?? 'No discovery document found',
    };
  }

  const expectedOrigin = new URL(discovered.origin).origin;

  let rawOpenApi: z.infer<typeof registryOpenApiMetadataSchema> | undefined;
  if (discovered.source === 'openapi' && requireOperationMetadata) {
    try {
      const response = await fetch(expectedOrigin + '/openapi.json', {
        headers: { Accept: 'application/json', ...headers },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!response.ok) {
        return {
          success: false,
          resources: [],
          error:
            'OpenAPI operation metadata could not be fetched for registration',
        };
      }
      const parsed = registryOpenApiMetadataSchema.safeParse(
        await response.json()
      );
      if (!parsed.success) {
        return {
          success: false,
          resources: [],
          error: 'OpenAPI operation metadata is invalid for registration',
        };
      }
      rawOpenApi = parsed.data;
    } catch {
      return {
        success: false,
        resources: [],
        error:
          'OpenAPI operation metadata could not be fetched for registration',
      };
    }
  }

  const openApiPaths = rawOpenApi
    ? normalizedOpenApiPathMap(rawOpenApi)
    : undefined;

  if (requireOperationMetadata && discovered.source === 'openapi') {
    if (!openApiPaths || openApiPaths.size === 0) {
      return {
        success: false,
        resources: [],
        error: 'OpenAPI operation metadata contains no usable paths',
      };
    }
    const missingOperation = discovered.endpoints.find(endpoint => {
      const pathItem = openApiPaths.get(normalizeDiscoveryPath(endpoint.path));
      return !operationForMethod(pathItem, endpoint.method);
    });
    if (missingOperation) {
      return {
        success: false,
        resources: [],
        error:
          'OpenAPI operation metadata does not match the discovered operation set',
      };
    }
  }

  const resources: DiscoveredResource[] = discovered.endpoints.flatMap(
    endpoint => {
      try {
        const resolved = new URL(endpoint.path, discovered.origin);
        // Security: reject endpoints that resolve to a different origin.
        // A malicious OpenAPI spec could contain absolute URLs pointing
        // elsewhere (new URL('https://evil.com/x', base) ignores the base).
        if (resolved.origin !== expectedOrigin) return [];
        // Build the URL without URL-encoding so OpenAPI path templates
        // like /v1/candles/{coin}/{interval} keep raw braces instead of
        // being encoded to %7Bcoin%7D.
        const url = endpoint.path.includes('://')
          ? endpoint.path
          : `${expectedOrigin}${endpoint.path.startsWith('/') ? '' : '/'}${endpoint.path}`;
        const description = endpointDescription(endpoint);
        const resource: DiscoveredResource = {
          url,
          method: endpoint.method,
        };
        if (endpoint.authMode) resource.authMode = endpoint.authMode;
        if (endpoint.pricingMode) resource.pricingMode = endpoint.pricingMode;
        if (endpoint.price) resource.price = endpoint.price;
        if (description) resource.description = description;

        if (openApiPaths) {
          const pathItem = openApiPaths.get(
            normalizeDiscoveryPath(endpoint.path)
          );
          const operation = operationForMethod(pathItem, endpoint.method);
          if (operation) {
            if (operation['x-query-parameters-schema'] !== undefined) {
              resource.queryParametersSchema =
                operation['x-query-parameters-schema'];
            }
            if (operation['x-x402scan-register'] !== undefined) {
              resource.registryEligible = operation['x-x402scan-register'];
            }
          }
        }

        return [resource];
      } catch {
        return [];
      }
    }
  );

  if (resources.length === 0) {
    return {
      success: false,
      resources: [],
      error: 'No x402 endpoints found',
    };
  }

  const result: X402DiscoveryResult = {
    success: true,
    source: mapSourceToDiscoverySource(discovered.source),
    resources,
    ownershipProofs: discovered.ownershipProofs ?? [],
  };
  if (discovered.info) result.info = discovered.info;
  if (discovered.info?.contactEmail) {
    result.contactEmail = discovered.info.contactEmail;
  }
  return result;
}
