/**
 * EVM Sign-In-With-Ethereum (SIWE) support
 *
 * Implements EIP-4361 compliant message format and signature verification
 * for EVM chains (Ethereum, Base, Polygon, etc.)
 */

import { verifyMessage } from "viem";
import { SiweMessage } from "siwe";
import type { SIWxExtensionInfo, EVMMessageVerifier } from "./types";

/**
 * Extract numeric chain ID from CAIP-2 EVM chainId.
 *
 * @param chainId - CAIP-2 format chain ID (e.g., "eip155:8453")
 * @returns Numeric chain ID (e.g., 8453)
 * @throws Error if chainId format is invalid
 *
 * @example
 * ```typescript
 * extractEVMChainId("eip155:1")    // 1 (Ethereum mainnet)
 * extractEVMChainId("eip155:8453") // 8453 (Base)
 * extractEVMChainId("eip155:137")  // 137 (Polygon)
 * ```
 */
export function extractEVMChainId(chainId: string): number {
  const match = /^eip155:(\d+)$/.exec(chainId);
  if (!match) {
    throw new Error(`Invalid EVM chainId format: ${chainId}. Expected eip155:<number>`);
  }
  return parseInt(match[1], 10);
}

/**
 * Format SIWE message following EIP-4361 specification.
 *
 * Uses the siwe library to ensure message format matches verification.
 *
 * @param info - Server-provided extension info
 * @param address - Client's EVM wallet address (0x-prefixed)
 * @returns Message string ready for signing
 *
 * @example
 * ```typescript
 * const message = formatSIWEMessage(serverInfo, "0x1234...abcd");
 * // Returns EIP-4361 formatted message:
 * // "api.example.com wants you to sign in with your Ethereum account:
 * // 0x1234...abcd
 * //
 * // Sign in to access your content
 * //
 * // URI: https://api.example.com/data
 * // Version: 1
 * // Chain ID: 8453
 * // Nonce: abc123
 * // Issued At: 2024-01-01T00:00:00.000Z"
 * ```
 */
export function formatSIWEMessage(info: SIWxExtensionInfo, address: string): string {
  const numericChainId = extractEVMChainId(info.chainId);

  const siweMessage = new SiweMessage({
    domain: info.domain,
    address,
    statement: info.statement,
    uri: info.uri,
    version: info.version,
    chainId: numericChainId,
    nonce: info.nonce,
    issuedAt: info.issuedAt,
    expirationTime: info.expirationTime,
    notBefore: info.notBefore,
    requestId: info.requestId,
    resources: info.resources,
  });

  return siweMessage.prepareMessage();
}

/**
 * Verify EVM signature.
 *
 * Supports:
 * - EOA signatures (standard ECDSA via EIP-191) - always available
 * - EIP-1271 (deployed smart contract wallets) - requires verifier
 * - EIP-6492 (counterfactual/pre-deploy smart wallets) - requires verifier
 *
 * @param message - The SIWE message that was signed
 * @param address - The claimed signer address
 * @param signature - The signature to verify
 * @param verifier - Optional message verifier for smart wallet support.
 *                   Pass publicClient.verifyMessage for EIP-1271/EIP-6492 support.
 *                   Without this, only EOA signatures are verified.
 * @returns true if signature is valid
 *
 * @example
 * ```typescript
 * // EOA-only verification (default, no RPC required)
 * const valid = await verifyEVMSignature(message, address, signature);
 *
 * // Smart wallet verification with viem PublicClient
 * import { createPublicClient, http } from 'viem';
 * import { base } from 'viem/chains';
 *
 * const publicClient = createPublicClient({ chain: base, transport: http() });
 * const valid = await verifyEVMSignature(
 *   message,
 *   address,
 *   signature,
 *   publicClient.verifyMessage
 * );
 * ```
 */
export async function verifyEVMSignature(
  message: string,
  address: string,
  signature: string,
  verifier?: EVMMessageVerifier,
): Promise<boolean> {
  const args = {
    address: address as `0x${string}`,
    message,
    signature: signature as `0x${string}`,
  };

  if (verifier) {
    // Use provided verifier (supports EIP-1271/EIP-6492 via RPC)
    return verifier(args);
  }

  // Fallback to standalone verifyMessage (EOA only, no RPC)
  return verifyMessage(args);
}
