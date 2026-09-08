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
import { z } from 'zod';

import type { Prisma } from '@x402scan/scan-db';

export const FREE_AUTH_MODES = ['siwx', 'unprotected', 'apiKey'] as const;

export type FreeAuthMode = (typeof FREE_AUTH_MODES)[number];

/**
 * Resource.metadata is a free-form JSON column (Prisma.JsonValue); these
 * schemas parse the specific fields this module cares about at the boundary.
 */
const authModeMetadataSchema = z.looseObject({
  authMode: z.enum(FREE_AUTH_MODES),
});

const descriptionMetadataSchema = z.looseObject({
  description: z.string().min(1),
});

export function getResourceAuthMode(
  metadata: Prisma.JsonValue
): FreeAuthMode | null {
  const parsed = authModeMetadataSchema.safeParse(metadata);
  return parsed.success ? parsed.data.authMode : null;
}

export function isFreeResource(resource: {
  metadata: Prisma.JsonValue;
}): boolean {
  return getResourceAuthMode(resource.metadata) !== null;
}

/**
 * Endpoint display description captured from discovery at registration time
 * (openapi operation summary/description). The only description source for
 * free resources; a fallback for paid ones whose 402 accepts lack one.
 */
export function getResourceMetadataDescription(
  metadata: Prisma.JsonValue
): string | null {
  const parsed = descriptionMetadataSchema.safeParse(metadata);
  return parsed.success ? parsed.data.description : null;
}
