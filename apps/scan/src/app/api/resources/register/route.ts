import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { registerResource } from '@/lib/resources';
import { extractX402Data } from '@/lib/x402';
import { getOriginFromUrl, normalizeUrl } from '@/lib/url';
import { fetchDiscoveryDocument } from '@/services/discovery';

import { Methods } from '@/types/x402';

import type { DiscoveryInfo } from '@/types/discovery';

const registerSchema = z.object({
  url: z.string().url(),
  headers: z.record(z.string(), z.string()).optional(),
});

/**
 * POST /api/resources/register
 *
 * Register a single x402 resource by URL.
 * The endpoint will probe the URL with POST and GET to find a 402 response,
 * parse the x402 payment requirements, and register the resource.
 *
 * Request body:
 *   { "url": "https://example.com/api/resource", "headers": { "X-Custom": "value" } }
 *
 * Response:
 *   - 200: Resource registered (or error details from the x402 response)
 *   - 400: Invalid request body
 *   - 500: Internal server error
 */
export const POST = async (request: NextRequest) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid request body',
        details: parsed.error.issues,
      },
      { status: 400 }
    );
  }

  const { url, headers: customHeaders } = parsed.data;

  try {
    let parseErrorData: {
      parseErrors: string[];
      data: unknown;
    } | null = null;

    for (const method of [Methods.POST, Methods.GET]) {
      const response = await fetch(url.replace('{', '').replace('}', ''), {
        method,
        headers:
          method === Methods.POST
            ? {
                ...customHeaders,
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
              }
            : { ...customHeaders, 'Cache-Control': 'no-cache' },
        body: method === Methods.POST ? '{}' : undefined,
        cache: 'no-store',
      });

      if (response.status !== 402) {
        continue;
      }

      const x402Data = await extractX402Data(response);
      const result = await registerResource(url, x402Data);

      if (result.success === false) {
        if (result.error.type === 'parseResponse') {
          parseErrorData = {
            data: result.data,
            parseErrors: result.error.parseErrors,
          };
          continue;
        } else {
          parseErrorData = {
            data: result.data ?? null,
            parseErrors:
              'parseErrors' in result.error &&
              Array.isArray(result.error.parseErrors)
                ? result.error.parseErrors
                : [JSON.stringify(result.error)],
          };
          continue;
        }
      }

      // Check for discovery document
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
        // Discovery check failed silently
      }

      return NextResponse.json({
        ...result,
        methodUsed: method,
        discovery,
      });
    }

    if (parseErrorData) {
      return NextResponse.json({
        success: false,
        data: parseErrorData.data,
        error: {
          type: 'parseErrors',
          parseErrors: parseErrorData.parseErrors,
        },
      });
    }

    return NextResponse.json({
      success: false,
      error: {
        type: 'no402',
        message: 'The URL did not respond with HTTP 402 for any method (POST, GET)',
      },
    });
  } catch (error) {
    console.error('Resource registration failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
};
