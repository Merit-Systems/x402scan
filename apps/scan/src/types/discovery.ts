/**
 * x402 Discovery Types
 */

import type { AuthMode } from '@agentcash/discovery';

/**
 * A discovered resource with URL and optional HTTP method.
 * Method is specified in discovery doc like "POST /api/resource"
 */
export interface DiscoveredResource {
  /** Concrete URL used for probing (may include real IDs like `/events/397003`). */
  url: string;
  /**
   * Canonical templated URL stored in the DB
   * (e.g. `/events/{event_id}`). Falls back to `url` when no template
   * could be derived from the OpenAPI document.
   */
  canonicalUrl?: string;
  method?:
    | 'GET'
    | 'POST'
    | 'PUT'
    | 'PATCH'
    | 'DELETE'
    | 'HEAD'
    | 'OPTIONS'
    | 'TRACE';
  /** Auth classification from discovery (paid, siwx, apiKey, apiKey+paid, unprotected). */
  authMode?: AuthMode;
  /** If true, this resource failed validation */
  invalid?: boolean;
  /** Error message if resource is invalid */
  invalidReason?: string;
}

export type { AuthMode };

export type DiscoverySource =
  | 'openapi'
  | 'well-known'
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
