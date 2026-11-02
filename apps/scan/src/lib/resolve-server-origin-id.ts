import { notFound } from 'next/navigation';

import { findOriginIdByParam } from '@/services/db/resources/origin';

/**
 * Resolve a /server/[id] route param to an origin UUID.
 * Hostname slugs map to the matching ResourceOrigin id; unknown ids call notFound().
 */
export async function resolveServerOriginId(id: string): Promise<string> {
  const resolved = await findOriginIdByParam(id);

  if (!resolved) {
    notFound();
  }

  return resolved;
}
