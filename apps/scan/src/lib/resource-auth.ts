/**
 * Auth modes for free (no-Accepts) resources. These rows exist so the full
 * API catalog renders on server pages; the discriminator lives in
 * Resource.metadata.authMode since the schema has no dedicated column.
 *
 * - 'siwx'        — free, identity-gated (Sign-In With X)
 * - 'unprotected' — explicitly public via OpenAPI `security: []`
 * - 'apiKey'      — gated by a merchant-issued API key, not payable via x402
 *
 * Pure module — safe to import from both server DB code and client components.
 */
export const FREE_AUTH_MODES = ['siwx', 'unprotected', 'apiKey'] as const;

export type FreeAuthMode = (typeof FREE_AUTH_MODES)[number];

export function getResourceAuthMode(metadata: unknown): FreeAuthMode | null {
  if (
    metadata != null &&
    typeof metadata === 'object' &&
    !Array.isArray(metadata) &&
    'authMode' in metadata &&
    (FREE_AUTH_MODES as readonly unknown[]).includes(
      (metadata as { authMode: unknown }).authMode
    )
  ) {
    return (metadata as { authMode: FreeAuthMode }).authMode;
  }
  return null;
}

export function isFreeResource(resource: { metadata: unknown }): boolean {
  return getResourceAuthMode(resource.metadata) !== null;
}
