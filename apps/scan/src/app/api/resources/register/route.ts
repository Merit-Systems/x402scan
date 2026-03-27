import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { registerResource } from '@/lib/resources';
import { probeX402Endpoint } from '@/lib/discovery/probe';
import { getOriginFromUrl, normalizeUrl } from '@/lib/url';
import { fetchDiscoveryDocument } from '@/services/discovery';
import type { DiscoveryInfo } from '@/types/discovery';

const registerInputSchema = z.object({
  url: z.string().url('A valid URL is required'),
});

const batchRegisterInputSchema = z.object({
  urls: z
    .array(z.string().url('Each entry must be a valid URL'))
    .min(1, 'At least one URL is required')
    .max(20, 'Maximum 20 URLs per request'),
});

/**
 * POST /api/resources/register
 *
 * Register a single resource or a batch of resources programmatically.
 *
 * Single resource:
 *   { "url": "https://example.com/api/resource" }
 *
 * Batch resources:
 *   { "urls": ["https://example.com/api/a", "https://example.com/api/b"] }
 */
export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();

    // Determine if single or batch request
    if ('urls' in body && Array.isArray(body.urls)) {
      return handleBatchRegister(body);
    }

    return handleSingleRegister(body);
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

    console.error('Resource registration failed:', error);
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

async function handleSingleRegister(body: unknown) {
  const { url } = registerInputSchema.parse(body);

  const probeResult = await probeX402Endpoint(
    url.replaceAll('{', '').replaceAll('}', '')
  );

  if (!probeResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          type: 'no402',
          message:
            'URL did not return a 402 response. Ensure the resource requires x402 payment.',
        },
      },
      { status: 422 }
    );
  }

  const result = await registerResource(url, probeResult.advisory);

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        data: result.data,
        error: {
          type: 'registration_failed',
          details:
            result.error.type === 'parseResponse'
              ? result.error.parseErrors
              : [JSON.stringify(result.error)],
        },
      },
      { status: 422 }
    );
  }

  // Check for additional resources via discovery
  const origin = getOriginFromUrl(url);
  let discovery: DiscoveryInfo = {
    found: false,
    otherResourceCount: 0,
    origin,
  };

  try {
    const discoveryResult = await fetchDiscoveryDocument(origin);
    if (
      discoveryResult.success &&
      Array.isArray(discoveryResult.resources)
    ) {
      const normalizedInputUrl = normalizeUrl(url);
      const otherResources = discoveryResult.resources.filter(r => {
        if (
          !r ||
          typeof r !== 'object' ||
          !('url' in r) ||
          typeof r.url !== 'string'
        ) {
          return false;
        }
        return normalizeUrl(String(r.url)) !== normalizedInputUrl;
      });
      discovery = {
        found: true,
        source: discoveryResult.source,
        otherResourceCount: otherResources.length,
        origin,
        resources: otherResources.map(r => r.url),
      };
    }
  } catch {
    // Discovery check failed, continue without discovery info
  }

  return NextResponse.json({
    ...result,
    methodUsed: probeResult.advisory.method,
    discovery,
  });
}

async function handleBatchRegister(body: unknown) {
  const { urls } = batchRegisterInputSchema.parse(body);

  const results = await Promise.all(
    urls.map(async url => {
      try {
        const probeResult = await probeX402Endpoint(
          url.replaceAll('{', '').replaceAll('}', '')
        );

        if (!probeResult.success) {
          return {
            url,
            success: false as const,
            error: 'No 402 response from URL',
          };
        }

        const result = await registerResource(url, probeResult.advisory);

        if (!result.success) {
          return {
            url,
            success: false as const,
            error:
              result.error.type === 'parseResponse'
                ? result.error.parseErrors.join(', ')
                : JSON.stringify(result.error),
          };
        }

        return {
          url,
          success: true as const,
          resourceId: result.resource.resource.id,
        };
      } catch (error) {
        return {
          url,
          success: false as const,
          error:
            error instanceof Error ? error.message : 'Unknown error',
        };
      }
    })
  );

  const registered = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  return NextResponse.json({
    success: true,
    registered: registered.length,
    failed: failed.length,
    results,
  });
}
