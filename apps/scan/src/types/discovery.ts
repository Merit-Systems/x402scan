/**
 * x402 Discovery Types
 */

/**
 * A discovered resource with URL and optional HTTP method.
 * Method is specified in discovery doc like "POST /api/resource"
 */
export interface DiscoveredResource {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** If true, this resource failed validation */
  invalid?: boolean;
  /** Error message if resource is invalid */
  invalidReason?: string;
}

export type DiscoverySource =
  | 'openapi'
  | 'well-known'
  | 'dns'
  | 'probe'
  | 'interop-mpp';

/**
 * Result from fetching and parsing discovery documents.
 */
export interface X402DiscoveryResult {
  success: boolean;
  source?: DiscoverySource;
  /** Resources with URLs and optional methods */
  resources: DiscoveredResource[];
  discoveryUrls: string[];
  /** Optional instructions for AI agents consuming this API */
  instructions?: string;
  /**
   * Ownership proofs - signatures of the origin string using the payTo address private key.
   * Verifies the resource owner is the actual recipient of funds (prevents spoofing attacks).
   */
  ownershipProofs?: string[];
  /**
   * Whether ownership was verified (at least one proof matched a payTo address).
   * Only set after verification against actual resource payTo addresses.
   */
  ownershipVerified?: boolean;
  error?: string;
}

/**
 * Discovery info returned to client after single resource registration.
 * Indicates if other resources were discovered at the same origin.
 */
export interface DiscoveryInfo {
  found: boolean;
  source?: DiscoverySource;
  otherResourceCount: number;
  origin: string;
  resources?: string[];
}
