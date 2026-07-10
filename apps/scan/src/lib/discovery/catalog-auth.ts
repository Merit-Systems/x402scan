/**
 * Catalog gating: we only surface endpoints that the merchant declared in
 * their openapi.json. The openapi discovery source assigns authMode from the
 * spec's own security declarations — `unprotected` only for an explicit
 * `security: []`, `apiKey` only for a declared apiKey security scheme — so
 * authMode + source is sufficient provenance to register the endpoint as a
 * free catalog row ("Public" / "API key"). Other sources (well-known doc,
 * probes) never produce catalog rows.
 *
 * Shared by server registration (register-origin.ts) and the client
 * pre-registration flow (use-discovery / register form) — keep them agreeing
 * on what registers.
 */
export function isOpenApiDeclaredFree(
  authMode: string | undefined,
  source: string | undefined
): boolean {
  return (
    (authMode === 'unprotected' || authMode === 'apiKey') &&
    source === 'openapi'
  );
}

/** Auth modes that always register regardless of discovery source. */
const ALWAYS_REGISTRABLE = new Set(['paid', 'apiKey+paid', 'siwx']);

export function isRegistrableEndpoint(
  authMode: string | undefined,
  source: string | undefined
): boolean {
  // Unclassified endpoints may be paid but undetected by discovery
  // (e.g. bazaar-only endpoints) — probe them.
  if (authMode == null) return true;
  if (ALWAYS_REGISTRABLE.has(authMode)) return true;
  return isOpenApiDeclaredFree(authMode, source);
}
