import {
  parseDiscoveryDocument,
  resolveResourceWithMethod,
} from '@/lib/x402/discovery-schema';
import { getOriginFromUrl } from '@/lib/url';
import { isLocalUrl } from '@/lib/url-helpers';

import { lookupX402TxtRecord } from './dns-lookup';

import type {
  DiscoveredResource,
  X402DiscoveryResult,
} from '@/types/discovery';

const FETCH_TIMEOUT_MS = 10000;

/**
 * Fetch x402 discovery document(s) for an origin.
 *
 * Discovery order:
 * 1. Check DNS TXT records at _x402.{hostname}
 * 2. If DNS records found, fetch documents from all URLs
 * 3. Fall back to {origin}/.well-known/x402 if no DNS records
 *
 * @param originOrUrl - Origin URL or full URL (origin will be extracted)
 * @returns Merged list of discovered resource URLs
 */
export async function fetchDiscoveryDocument(
  originOrUrl: string
): Promise<X402DiscoveryResult> {
  // Extract origin from URL if full URL provided
  const origin = originOrUrl.includes('://')
    ? getOriginFromUrl(originOrUrl)
    : `https://${originOrUrl}`;

  // Skip local URLs in production
  if (isLocalUrl(origin)) {
    return {
      success: false,
      resources: [],
      discoveryUrls: [],
      error: 'Local URLs are not supported',
    };
  }

  const hostname = new URL(origin).hostname;

  // Step 1: Check DNS TXT records first
  const dnsResult = await lookupX402TxtRecord(hostname);

  if (dnsResult.found && dnsResult.records.length > 0) {
    const discoveryUrls = dnsResult.records.map(r => r.url);
    const allResources: DiscoveredResource[] = [];
    let instructions: string | undefined;
    let ownershipProofs: string[] | undefined;
    const errors: string[] = [];

    // Fetch documents from all DNS-specified URLs
    // Pass the origin so paths can be resolved relative to it
    const results = await Promise.allSettled(
      discoveryUrls.map(url => fetchAndParseDocument(url, origin))
    );

    for (const [i, result] of results.entries()) {
      if (result.status === 'fulfilled' && result.value.success) {
        allResources.push(...result.value.resources);
        // Use first instructions found
        if (!instructions && result.value.instructions) {
          instructions = result.value.instructions;
        }
        // Merge ownership proofs from all documents
        if (result.value.ownershipProofs?.length) {
          ownershipProofs = [
            ...(ownershipProofs ?? []),
            ...result.value.ownershipProofs,
          ];
        }
      } else if (result.status === 'fulfilled' && !result.value.success) {
        errors.push(`${discoveryUrls[i]}: ${result.value.error}`);
      } else if (result.status === 'rejected') {
        errors.push(`${discoveryUrls[i]}: ${String(result.reason)}`);
      }
    }

    // Deduplicate resources by URL
    const seenUrls = new Set<string>();
    const uniqueResources = allResources.filter(r => {
      if (seenUrls.has(r.url)) return false;
      seenUrls.add(r.url);
      return true;
    });

    if (uniqueResources.length > 0) {
      return {
        success: true,
        source: 'dns',
        resources: uniqueResources,
        discoveryUrls,
        instructions,
        ownershipProofs,
      };
    }

    // DNS records existed but no valid resources found, fall through to well-known
    if (errors.length > 0) {
      console.warn('DNS discovery errors:', errors);
    }
  }

  // Step 2: Fall back to /.well-known/x402
  const wellKnownUrl = `${origin}/.well-known/x402`;
  const wellKnownResult = await fetchAndParseDocument(wellKnownUrl, origin);

  if (wellKnownResult.success) {
    return {
      success: true,
      source: 'well-known',
      resources: wellKnownResult.resources,
      discoveryUrls: [wellKnownUrl],
      instructions: wellKnownResult.instructions,
      ownershipProofs: wellKnownResult.ownershipProofs,
    };
  }

  return {
    success: false,
    resources: [],
    discoveryUrls: [],
    error: wellKnownResult.error ?? 'No discovery document found',
  };
}

/**
 * Fetch and parse a single discovery document.
 * @param url - URL to fetch the discovery document from
 * @param resolveOrigin - Origin to resolve relative paths against
 */
async function fetchAndParseDocument(
  url: string,
  resolveOrigin: string
): Promise<
  | {
      success: true;
      resources: DiscoveredResource[];
      instructions?: string;
      ownershipProofs?: string[];
    }
  | { success: false; error: string }
> {
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const data: unknown = await response.json();
    const parsed = parseDiscoveryDocument(data);

    if (!parsed.success) {
      return { success: false, error: parsed.error };
    }

    // Resolve paths relative to the origin being checked (not the discovery document URL)
    // Also extract method if specified in the resource string
    const resolvedResources = parsed.data.resources.map(resource =>
      resolveResourceWithMethod(resource, resolveOrigin)
    );

    return {
      success: true,
      resources: resolvedResources,
      instructions: parsed.data.instructions,
      ownershipProofs: parsed.data.ownershipProofs,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Fetch failed',
    };
  }
}
