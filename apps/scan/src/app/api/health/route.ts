/**
 * Public liveness endpoint for the x402scan API.
 *
 * Referenced as the `status` relation in the RFC 9727 API catalog
 * (`/.well-known/api-catalog`) so agents can programmatically check that the
 * API is reachable. Intentionally dependency-free (no DB / network calls) so it
 * reflects process liveness and can't be made to fail by a slow downstream.
 */
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json(
    {
      status: 'ok',
      service: 'x402scan',
      time: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
