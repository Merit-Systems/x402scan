import { PROBE_TIMEOUT_MS } from './utils';

/**
 * Say what an origin's `/openapi.json` returned when discovery found nothing.
 *
 * `@agentcash/discovery` turns a non-2xx or unparseable `/openapi.json` into a
 * plain `not_found` with no message, so the provider only sees "No discovery
 * document found". The common case is a CDN that blocks datacenter requests:
 * Cloudflare answers with a 403 "Just a moment..." page marked
 * `cf-mitigated: challenge`, and the provider's server never sees a request.
 *
 * Returns null when the origin serves JSON (discovery's own result stands) or
 * when the probe itself fails (discovery already reports network errors).
 */
export async function describeOpenApiFailure(
  origin: string,
  headers: Record<string, string> = {}
): Promise<string | null> {
  const url = `${origin}/openapi.json`;
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json', ...headers },
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    if (response.headers.get('cf-mitigated')?.toLowerCase() === 'challenge') {
      return (
        `No discovery document found: Cloudflare answered ${url} with a ` +
        `bot challenge (HTTP ${response.status}), so the request never ` +
        'reached your server. Allow automated requests to /openapi.json in ' +
        'your Cloudflare security settings, then try again.'
      );
    }
    if (!response.ok) {
      return `No discovery document found: ${url} returned HTTP ${response.status}.`;
    }
    const body = await response.text();
    try {
      JSON.parse(body);
      return null;
    } catch {
      const contentType = response.headers.get('content-type') ?? 'no type';
      return `No discovery document found: ${url} returned ${contentType}, not JSON.`;
    }
  } catch {
    return null;
  }
}
