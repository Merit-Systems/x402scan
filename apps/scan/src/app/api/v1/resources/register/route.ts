import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { probeX402Endpoint } from '@/lib/discovery/probe';
import { registerResource } from '@/lib/resources';

const registerBodySchema = z.object({
  url: z.string().url('A valid URL is required'),
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
 * POST /api/v1/resources/register
 *
 * Register a single x402-protected resource by URL.
 * The endpoint probes the URL for a 402 response, parses payment info,
 * and registers it on x402scan.
 *
 * Body: { "url": "https://example.com/api/resource" }
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

  const parsed = registerBodySchema.safeParse(body);
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

  const { url } = parsed.data;

  try {
    const probeResult = await probeX402Endpoint(
      url.replaceAll('{', '').replaceAll('}', '')
    );

    if (!probeResult.success) {
      return jsonResponse(
        {
          success: false,
          error: {
            type: 'no_402',
            message: 'URL did not return a 402 Payment Required response',
            details: probeResult.error,
          },
        },
        422
      );
    }

    const result = await registerResource(url, probeResult.advisory);

    if (!result.success) {
      return jsonResponse(
        {
          success: false,
          error: {
            type: 'parse_error',
            message: 'Failed to parse x402 response',
            parseErrors:
              result.error.type === 'parseResponse'
                ? result.error.parseErrors
                : [JSON.stringify(result.error)],
          },
          data: result.data,
        },
        422
      );
    }

    return jsonResponse({
      success: true,
      resource: result.resource,
      accepts: result.accepts,
      registrationDetails: result.registrationDetails,
    });
  } catch (error) {
    console.error('Resource registration failed:', error);
    return jsonResponse(
      {
        success: false,
        error: {
          type: 'internal_error',
          message: 'An unexpected error occurred during registration',
        },
      },
      500
    );
  }
}
