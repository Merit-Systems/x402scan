import { resourceKey } from '@/lib/resource-key';
import { normalizeResourceUrl } from '@/lib/url';

export interface RegistrationCandidate {
  url: string;
  method?: string;
}

export interface NormalizedRegistrationCandidate {
  originalUrl: string;
  resource: string;
  method?: string;
}

export interface StoredResourceKey {
  resource: string;
  method: string;
}

export function normalizeRegistrationCandidates(
  resources: RegistrationCandidate[]
): NormalizedRegistrationCandidate[] {
  return resources.map(candidate => ({
    originalUrl: candidate.url,
    resource: normalizeResourceUrl(candidate.url),
    method: candidate.method?.toUpperCase(),
  }));
}

/** Partition submitted URLs using the same normalized composite key as writes.
 * A candidate without a method intentionally matches any stored method. */
export function partitionRegistrationCandidates(
  candidates: NormalizedRegistrationCandidate[],
  stored: StoredResourceKey[]
): { registered: string[]; unregistered: string[] } {
  const storedKeys = new Set(
    stored.map(row => resourceKey(row.resource, row.method))
  );
  const storedResources = new Set(stored.map(row => row.resource));
  const isRegistered = (candidate: NormalizedRegistrationCandidate) =>
    candidate.method
      ? storedKeys.has(resourceKey(candidate.resource, candidate.method))
      : storedResources.has(candidate.resource);

  return {
    registered: candidates
      .filter(isRegistered)
      .map(candidate => candidate.originalUrl),
    unregistered: candidates
      .filter(candidate => !isRegistered(candidate))
      .map(candidate => candidate.originalUrl),
  };
}
