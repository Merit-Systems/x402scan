import { z as z3 } from 'zod3';

import type { X402DiscoveryDocument } from '@/types/discovery';

const VALID_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
type HttpMethod = (typeof VALID_METHODS)[number];

/**
 * Resource entry can be:
 * - A full URL (https://example.com/api/resource)
 * - A path starting with / (/api/resource)
 * - Prefixed with method: "POST /api/resource" or "GET https://example.com/api"
 */
const resourceEntrySchema = z3.string().refine(
  val => {
    // Check if it starts with a method prefix
    const parts = val.split(' ');
    if (parts.length === 2 && VALID_METHODS.includes(parts[0] as HttpMethod)) {
      const urlPart = parts[1]!;
      return (
        urlPart.startsWith('/') ||
        urlPart.startsWith('https://') ||
        urlPart.startsWith('http://')
      );
    }
    // Otherwise must be a URL or path directly
    return (
      val.startsWith('/') ||
      val.startsWith('https://') ||
      val.startsWith('http://')
    );
  },
  {
    message:
      'Resource must be a full URL, a path starting with /, or prefixed with HTTP method (e.g., "POST /api/resource")',
  }
);

/**
 * Zod schema for x402 discovery document validation.
 * Documents are served at /.well-known/x402 or a URL from DNS TXT record.
 */
const x402DiscoveryDocumentSchema = z3.object({
  version: z3.literal(1),
  resources: z3.array(resourceEntrySchema),
  /** Optional instructions for AI agents consuming this API */
  instructions: z3.string().optional(),
  /**
   * Ownership proofs - signatures of the origin string using the payTo address private key.
   * Used to verify the resource owner is the actual recipient of funds (prevents spoofing attacks).
   */
  ownershipProofs: z3.array(z3.string()).optional(),
});

export interface ParsedResource {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
}

/**
 * Parse a resource entry to extract method and URL.
 * Supports formats:
 * - "/path" -> { url: "/path" }
 * - "https://..." -> { url: "https://..." }
 * - "POST /path" -> { url: "/path", method: "POST" }
 * - "GET https://..." -> { url: "https://...", method: "GET" }
 */
function parseResourceEntry(resource: string): ParsedResource {
  const parts = resource.split(' ');
  if (parts.length === 2 && VALID_METHODS.includes(parts[0] as HttpMethod)) {
    return {
      url: parts[1]!,
      method: parts[0] as HttpMethod,
    };
  }
  return { url: resource };
}

/**
 * Resolve a resource entry to a full URL.
 * - If it's already a full URL, return as-is
 * - If it's a path, prepend the origin
 */
function resolveResourceUrl(resource: string, origin: string): string {
  const { url } = parseResourceEntry(resource);
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // It's a path - append to origin
  return `${origin.replace(/\/$/, '')}${url}`;
}

/**
 * Resolve a resource entry to a full URL and extract method if specified.
 */
export function resolveResourceWithMethod(
  resource: string,
  origin: string
): ParsedResource {
  const { url, method } = parseResourceEntry(resource);
  const resolvedUrl =
    url.startsWith('http://') || url.startsWith('https://')
      ? url
      : `${origin.replace(/\/$/, '')}${url}`;
  return { url: resolvedUrl, method };
}

/**
 * Parse and validate an x402 discovery document.
 * Individual invalid resources are marked but included instead of failing the entire parse.
 */
export function parseDiscoveryDocument(
  data: unknown
):
  | { success: true; data: X402DiscoveryDocument; invalidResources?: string[] }
  | { success: false; error: string } {
  // First validate basic structure (version, instructions, ownershipProofs)
  if (!data || typeof data !== 'object') {
    return {
      success: false,
      error: 'Invalid discovery document: not an object',
    };
  }

  const doc = data as Record<string, unknown>;

  // Validate version
  if (doc.version !== 1) {
    return {
      success: false,
      error: 'Invalid discovery document: version must be 1',
    };
  }

  // Validate resources array exists
  if (!Array.isArray(doc.resources)) {
    return {
      success: false,
      error: 'Invalid discovery document: resources must be an array',
    };
  }

  // Validate each resource individually - keep both valid and invalid
  const validResources: string[] = [];
  const invalidResources: string[] = [];

  for (const resource of doc.resources) {
    if (typeof resource !== 'string') {
      invalidResources.push(String(resource));
      continue;
    }

    // Try to validate the resource format
    const resourceResult = resourceEntrySchema.safeParse(resource);
    if (resourceResult.success) {
      validResources.push(resource);
    } else {
      invalidResources.push(resource);
    }
  }

  // If we have no valid resources at all, fail
  if (validResources.length === 0 && invalidResources.length === 0) {
    return {
      success: false,
      error: 'Invalid discovery document: no resources provided',
    };
  }

  // Validate optional fields
  const instructions = doc.instructions;
  if (instructions !== undefined && typeof instructions !== 'string') {
    return {
      success: false,
      error: 'Invalid discovery document: instructions must be a string',
    };
  }

  const ownershipProofs = doc.ownershipProofs;
  if (ownershipProofs !== undefined) {
    if (
      !Array.isArray(ownershipProofs) ||
      !ownershipProofs.every(p => typeof p === 'string')
    ) {
      return {
        success: false,
        error:
          'Invalid discovery document: ownershipProofs must be an array of strings',
      };
    }
  }

  // Return all resources (both valid and invalid will be handled downstream)
  return {
    success: true,
    data: {
      version: 1,
      resources: [...validResources, ...invalidResources],
      instructions,
      ownershipProofs: ownershipProofs,
    },
    invalidResources:
      invalidResources.length > 0 ? invalidResources : undefined,
  };
}

/**
 * Parse a DNS TXT record value for x402 discovery.
 * Format: v=x4021;[descriptor=<desc>;]url=<https_url>
 *
 * @returns Parsed record or null if invalid
 */
export function parseDnsTxtRecord(
  record: string
): { version: 'x4021'; descriptor?: string; url: string } | null {
  const parts = record.split(';').filter(Boolean);
  const parsed: Record<string, string> = {};

  for (const part of parts) {
    const eqIndex = part.indexOf('=');
    if (eqIndex === -1) continue;

    const key = part.slice(0, eqIndex).trim();
    const value = part.slice(eqIndex + 1).trim();
    parsed[key] = value;
  }

  // Validate required fields
  if (parsed.v !== 'x4021') {
    return null;
  }

  if (!parsed.url?.startsWith('https://')) {
    return null;
  }

  return {
    version: 'x4021',
    descriptor: parsed.descriptor,
    url: parsed.url,
  };
}
