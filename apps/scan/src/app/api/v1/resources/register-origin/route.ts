import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { fetchDiscoveryDocument } from '@/services/discovery';
import { registerResourcesFromDiscovery } from '@/lib/discovery/register-origin';

const registerOriginBodySchema = z.object({
  origin: z.string().url('A valid origin URL is required'),
});

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(data: unknown, status = 200): NextResponse {
  return NextResponse.json(
    JSON.parse(
      JSON.stringify(data, (_k, v: unknown) =>
        typeof v === 'bigint' ? Number(v) : v
      )
    ),
    { status, headers: corsHeaders }
  );
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

/**
 * POST /api/v1/resources/register-origin
 *
 * Discover and register all x402-protected resources from an origin.
 * Uses DNS TXT records (_x402.{hostname}) or /.well-known/x402 for discovery.
 *
 * Body: { "origin": "https://example.com" }
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      {
        success: false,
        error: {
          type: 'invalid_json',
          message: 'Request body must be valid JSON',
        },
      },
      400
    );
  }

  const parsed = registerOriginBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      {
        success: false,
        error: {
          type: 'validation_error',
          message: 'Invalid request body',
          details: parsed.error.issues,
        },
      },
      400
    );
  }

  const { origin } = parsed.data;

  try {
    const discoveryResult = await fetchDiscoveryDocument(origin);

    if (!discoveryResult.success) {
      return jsonResponse(
        {
          success: false,
          error: {
            type: 'no_discovery',
            message:
              discoveryResult.error ?? 'No discovery document found at origin',
          },
        },
        404
      );
    }

    const result = await registerResourcesFromDiscovery(
      discoveryResult.resources,
      discoveryResult.source
    );

    return jsonResponse({
      success: true,
      registered: result.registered,
      failed: result.failed,
      skipped: result.skipped,
      deprecated: result.deprecated,
      total: result.total,
      source: result.source,
      failedDetails:
        result.failedDetails.length > 0 ? result.failedDetails : undefined,
    });
  } catch (error) {
    console.error('Origin registration failed:', error);
    return jsonResponse(
      {
        success: false,
        error: {
          type: 'internal_error',
          message: 'An unexpected error occurred during origin registration',
        },
      },
      500
    );
  }
}
