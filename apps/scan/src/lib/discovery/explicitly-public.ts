/**
 * Whether a skipped endpoint is explicitly public: the OpenAPI operation
 * declares `security: []`. The openapi discovery source only ever emits
 * `authMode: 'unprotected'` for that declaration (probe-inferred endpoints
 * come from other sources), so authMode + source is sufficient provenance.
 *
 * Shared by server registration (register-origin.ts) and the client
 * pre-registration partition (register form) — keep them agreeing on what
 * counts as "the merchant already opted this endpoint out".
 */
export function isExplicitlyPublicSkip(
  authMode: string | undefined,
  source: string | undefined
): boolean {
  return authMode === 'unprotected' && source === 'openapi';
}
