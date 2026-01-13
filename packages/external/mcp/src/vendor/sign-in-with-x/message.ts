/**
 * CAIP-122 message construction for SIWX extension
 *
 * Constructs the canonical message string for signing.
 * Routes to chain-specific formatters based on chainId namespace.
 */

import { formatSIWEMessage } from "./evm";
import { formatSIWSMessage } from "./solana";
import type { SIWxExtensionInfo } from "./types";

/**
 * Construct CAIP-122 compliant message string for signing.
 *
 * Routes to the appropriate chain-specific message formatter based on the
 * chainId namespace prefix:
 * - `eip155:*` → SIWE (EIP-4361) format via siwe library
 * - `solana:*` → SIWS format
 *
 * @param serverInfo - Server-provided extension info
 * @param address - Client wallet address
 * @returns Message string ready for signing
 * @throws Error if chainId namespace is not supported
 *
 * @example
 * ```typescript
 * // EVM (Ethereum, Base, etc.)
 * const evmMessage = createSIWxMessage(serverInfo, "0x1234...");
 *
 * // Solana
 * const solMessage = createSIWxMessage(serverInfo, "BSmWDg...");
 * ```
 */
export function createSIWxMessage(serverInfo: SIWxExtensionInfo, address: string): string {
  // Route by chain namespace
  if (serverInfo.chainId.startsWith("eip155:")) {
    return formatSIWEMessage(serverInfo, address);
  }

  if (serverInfo.chainId.startsWith("solana:")) {
    return formatSIWSMessage(serverInfo, address);
  }

  throw new Error(
    `Unsupported chain namespace: ${serverInfo.chainId}. ` +
      `Supported: eip155:* (EVM), solana:* (Solana)`,
  );
}
