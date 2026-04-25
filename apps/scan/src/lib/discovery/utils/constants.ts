/** Default timeout for probing a live endpoint via checkEndpointSchema. */
export const PROBE_TIMEOUT_MS = 15000;

/**
 * User-Agent sent with server-side probes.
 *
 * Some endpoints sit behind Cloudflare Bot Fight Mode or similar WAFs that
 * block requests without a recognizable User-Agent. Using a well-known
 * identifier lets server operators allowlist x402scan's crawler while still
 * looking like a legitimate HTTP client.
 */
export const PROBE_USER_AGENT =
  'x402scan/1.0 (+https://x402scan.com; server-probe)';
