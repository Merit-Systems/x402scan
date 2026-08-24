/**
 * Public rate-limit policy for `/api/x402/*`. Kept dependency-free so docs and
 * markdown content can import it without pulling in Redis.
 */
export const RATE_LIMIT = {
  /** Policy name advertised in `RateLimit-Policy` / `RateLimit`. */
  policyName: 'default',
  /** Requests allowed per window, per client IP. */
  limit: 120,
  /** Fixed window length in seconds. */
  windowSeconds: 60,
} as const;
