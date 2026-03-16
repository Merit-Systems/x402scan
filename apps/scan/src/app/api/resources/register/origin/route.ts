import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { registerResource } from '@/lib/resources';
import { extractX402Data } from '@/lib/x402';
import { fetchDiscoveryDocument } from '@/services/discovery';
import { deprecateStaleResources } from '@/services/db/resources/resource';

import { Methods } from '@/types/x402';

const originSchema = z.object({
  origin: z.string().url(),
});

/**
 * POST /api/resources/register/origin
 *
 * Register all x402 resources discovered from an origin.
 * Uses DNS TXT records (_x402.{hostname}) or /.well-known/x402 for discovery.
 *
 * Request body:
 *   { "origin": "https://example.com" }
 *
 * Response:
 *   - 200: Registration results with counts of registered/failed resources
 *   - 400: Invalid request body or no discovery document found
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

  const parsed = originSchema.safeParse(body);
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

  const { origin } = parsed.data;

  try {
    const discoveryResult = await fetchDiscoveryDocument(origin);

    if (!discoveryResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: 'noDiscovery',
            message: discoveryResult.error ?? 'No discovery document found',
          },
        },
        { status: 400 }
      );
    }

    function getErrorMessage(err: unknown): string {
      if (typeof err === 'string') return err;
      if (!err || typeof err !== 'object') return 'Unknown error';
      if ('type' in err && typeof err.type === 'string') {
        const details: string[] = [];
        if ('parseErrors' in err && Array.isArray(err.parseErrors)) {
          details.push(...(err.parseErrors as string[]));
        } else if ('upsertErrors' in err && Array.isArray(err.upsertErrors)) {
          details.push(...(err.upsertErrors as string[]));
        }
        return details.length > 0
          ? `${err.type}: ${details.join(', ')}`
          : err.type;
      }
      return 'Unknown error';
    }

    const results = await Promise.allSettled(
      discoveryResult.resources.map(async resource => {
        const resourceUrl = resource.url;
        const methodsToTry = [Methods.POST, Methods.GET];

        let lastError = 'No 402 response';
        let lastStatus: number | undefined;
        const errors: string[] = [];

        for (const method of methodsToTry) {
          try {
            const response = await fetch(resourceUrl, {
              method,
              headers:
                method === Methods.POST
                  ? {
                      'Content-Type': 'application/json',
                      'Cache-Control': 'no-cache',
                    }
                  : { 'Cache-Control': 'no-cache' },
              body: method === Methods.POST ? '{}' : undefined,
              signal: AbortSignal.timeout(15000),
              cache: 'no-store',
            });

            lastStatus = response.status;

            if (response.status === 402) {
              const x402Data = await extractX402Data(response);
              const result = await registerResource(resourceUrl, x402Data);

              if (result.success) {
                return result;
              }

              const errorMsg =
                getErrorMessage(result.error) || 'Registration failed';
              errors.push(`${method}: ${errorMsg}`);
              lastError = errors.join('; ');
            } else {
              const errorMsg = `Expected 402, got ${response.status}`;
              errors.push(`${method}: ${errorMsg}`);
              lastError = errors.join('; ');
            }
          } catch (err) {
            const errorMsg =
              err instanceof Error ? err.message : 'Request failed';
            errors.push(`${method}: ${errorMsg}`);
            lastError = errors.join('; ');
          }
        }

        return {
          success: false as const,
          url: resourceUrl,
          error: lastError,
          status: lastStatus,
        };
      })
    );

    const successfulResults: { url: string }[] = [];
    const failedResults: { url: string; error: string; status?: number }[] = [];
    let originId: string | undefined;

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const resourceUrl = discoveryResult.resources[i]?.url ?? 'unknown';

      if (!result) continue;

      if (result.status === 'fulfilled' && result.value) {
        const value = result.value;
        if ('success' in value && value.success) {
          successfulResults.push({ url: resourceUrl });
          if (!originId && 'resource' in value && value.resource?.origin?.id) {
            originId = value.resource.origin.id;
          }
        } else if ('success' in value && !value.success) {
          failedResults.push({
            url: resourceUrl,
            error: value.error,
            status: 'status' in value ? value.status : undefined,
          });
        }
      } else if (result.status === 'rejected') {
        failedResults.push({
          url: resourceUrl,
          error:
            result.reason instanceof Error
              ? result.reason.message
              : 'Promise rejected',
        });
      }
    }

    // Deprecate resources that are no longer in the discovery document
    let deprecated = 0;
    if (originId) {
      const activeResourceUrls = discoveryResult.resources.map(r => r.url);
      deprecated = await deprecateStaleResources(originId, activeResourceUrls);
    }

    return NextResponse.json({
      success: true,
      registered: successfulResults.length,
      failed: failedResults.length,
      deprecated,
      total: results.length,
      source: discoveryResult.source,
      failedDetails: failedResults,
      originId,
    });
  } catch (error) {
    console.error('Origin registration failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
};
