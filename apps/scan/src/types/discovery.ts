/**
 * x402 Discovery Types
 *
 * Types for the x402 discovery protocol, supporting both DNS TXT records
 * and .well-known/x402 discovery documents.
 */

/**
 * A discovered resource with URL and optional HTTP method.
 * Method is specified in discovery doc like "POST /api/resource"
 */
export interface DiscoveredResource {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
}

/**
 * Parsed DNS TXT record for x402 discovery.
 * Format: v=x4021;[descriptor=<desc>;]url=<https_url>
 */
export interface X402DnsTxtRecord {
  version: 'x4021';
  descriptor?: string;
  url: string;
}

/**
 * Result from DNS TXT record lookup for _x402.{hostname}
 */
export interface X402DnsLookupResult {
  found: boolean;
  records: X402DnsTxtRecord[];
  error?: string;
}

/**
 * x402 discovery document structure.
 * Served at /.well-known/x402 or a URL specified in DNS TXT record.
 */
export interface X402DiscoveryDocument {
  version: 1;
  resources: string[];
  /** Optional instructions for AI agents consuming this API */
  instructions?: string;
}

/**
 * Result from fetching and parsing discovery documents.
 */
export interface X402DiscoveryResult {
  success: boolean;
  source?: 'dns' | 'well-known';
  /** Resources with URLs and optional methods */
  resources: DiscoveredResource[];
  discoveryUrls: string[];
  /** Optional instructions for AI agents consuming this API */
  instructions?: string;
  error?: string;
}

/**
 * Discovery info returned to client after single resource registration.
 * Indicates if other resources were discovered at the same origin.
 */
export interface DiscoveryInfo {
  found: boolean;
  source?: 'dns' | 'well-known';
  otherResourceCount: number;
  origin: string;
  resources?: string[];
}
