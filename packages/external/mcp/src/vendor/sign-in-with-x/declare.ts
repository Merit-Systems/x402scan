/**
 * Server-side declaration helper for SIWX extension
 *
 * Helps servers declare SIWX authentication requirements in PaymentRequired responses.
 */

import { randomBytes } from "crypto";
import type { SIWxExtension, SIWxExtensionInfo, DeclareSIWxOptions, SignatureType } from "./types";
import { SIGN_IN_WITH_X } from "./types";
import { buildSIWxSchema } from "./schema";

/**
 * Derive signature type from network.
 *
 * @param network - CAIP-2 network identifier
 * @returns Signature algorithm type
 */
function getSignatureType(network: string): SignatureType {
  return network.startsWith("solana:") ? "ed25519" : "eip191";
}

/**
 * Create a SIWX extension declaration for PaymentRequired.extensions
 *
 * Auto-generates:
 * - nonce: Cryptographically secure random string
 * - issuedAt: Current timestamp in ISO 8601 format
 * - domain: Extracted from resourceUri host
 * - resources: Array containing resourceUri
 *
 * @param options - Configuration options
 * @returns Extension object ready for PaymentRequired.extensions
 *
 * @example
 * ```typescript
 * const extensions = declareSIWxExtension({
 *   domain: 'api.example.com',
 *   resourceUri: 'https://api.example.com/data',
 *   network: 'eip155:8453',
 *   statement: 'Sign in to access your purchased content',
 * });
 *
 * // Include in PaymentRequired response
 * const paymentRequired = {
 *   x402Version: 2,
 *   resource: { url: 'https://api.example.com/data', ... },
 *   accepts: [...],
 *   extensions,
 * };
 * ```
 */
export function declareSIWxExtension(options: DeclareSIWxOptions): Record<string, SIWxExtension> {
  // Auto-generate fields per spec
  const nonce = randomBytes(16).toString("hex");
  const issuedAt = new Date().toISOString();
  const expirationTime =
    options.expirationTime ?? new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const info: SIWxExtensionInfo = {
    domain: options.domain,
    uri: options.resourceUri,
    version: options.version ?? "1",
    chainId: options.network,
    type: getSignatureType(options.network),
    nonce,
    issuedAt,
    expirationTime,
    resources: [options.resourceUri],
  };

  // Add optional fields if provided
  if (options.statement) {
    info.statement = options.statement;
  }
  if (options.signatureScheme) {
    info.signatureScheme = options.signatureScheme;
  }

  return {
    [SIGN_IN_WITH_X]: {
      info,
      schema: buildSIWxSchema(),
    },
  };
}
