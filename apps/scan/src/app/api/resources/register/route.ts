import { withCors, OPTIONS } from '@/lib/router';
import { jsonResponse } from '@/app/api/x402/_lib/utils';
import { registerResource } from '@/lib/resources';
import { probeX402Endpoint } from '@/lib/discovery/probe';
import { fetchDiscoveryDocument } from '@/services/discovery';
import { registerResourcesFromDiscovery } from '@/lib/discovery/register-origin';
import { z } from 'zod';

export { OPTIONS };

const registerBodySchema = z.object({
  url: z.string().url().describe('URL of the x402-protected resource to register').optional(),
  origin: z.string().url().describe('Origin URL to discover and register all x402 resources from').optional(),
}).refine(
  (data) => data.url || data.origin,
  { message: 'Either url or origin must be provided' }
);

/**
 * Public API endpoint for programmatic resource registration.
 * 
 * POST /api/resources/register
 * 
 * Request body (one of):
 *   { "url": "https://api.example.com/endpoint" } - Register a single resource
 *   { "origin": "https://api.example.com" } - Register all resources from an origin via discovery
 * 
 * No authentication required - designed for resource providers to register and refresh their offerings.
 */
export const POST = withCors(async (req: Request) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(
      { success: false, error: { type: 'invalid_json', message: 'Request body must be valid JSON' } },
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
          message: parsed.error.issues.map(i => i.message).join(', '),
        },
      },
      400
    );
  }

  // Handle single URL registration
  if (parsed.data.url) {
    const url = parsed.data.url;
    const probeResult = await probeX402Endpoint(
      url.replaceAll('{', '').replaceAll('}', '')
    );

    if (!probeResult.success) {
      return jsonResponse(
        { success: false, error: { type: 'no_402', message: probeResult.error } },
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

    return jsonResponse(
      JSON.parse(
        JSON.stringify(
          {
            success: true,
            mode: 'single',
            resource: result.resource,
            accepts: result.accepts,
            registrationDetails: result.registrationDetails,
          },
          (_k, v: unknown) => (typeof v === 'bigint' ? Number(v) : v)
        )
      )
    );
  }

  // Handle origin-based registration
  if (parsed.data.origin) {
    const origin = parsed.data.origin;
    const discoveryResult = await fetchDiscoveryDocument(origin);

    if (!discoveryResult.success) {
      return jsonResponse(
        {
          success: false,
          error: {
            type: 'no_discovery',
            message: discoveryResult.error ?? 'No discovery document found',
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
      mode: 'origin',
      registered: result.registered,
      failed: result.failed,
      skipped: result.skipped,
      deprecated: result.deprecated,
      total: result.total,
      source: result.source,
      failedDetails:
        result.failedDetails.length > 0 ? result.failedDetails : undefined,
    });
  }

  return jsonResponse(
    { success: false, error: { type: 'bad_request', message: 'Either url or origin must be provided' } },
    400
  );
});
