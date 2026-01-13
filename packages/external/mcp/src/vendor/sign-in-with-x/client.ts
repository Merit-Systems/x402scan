/**
 * Complete client flow for SIWX extension
 *
 * Combines message construction, signing, and payload creation.
 * Supports both EVM and Solana wallets.
 */

import type { SIWxExtensionInfo, SIWxPayload } from "./types";
import type { SIWxSigner, EVMSigner, SolanaSigner } from "./sign";
import { getEVMAddress, getSolanaAddress, signEVMMessage, signSolanaMessage } from "./sign";
import { createSIWxMessage } from "./message";

/**
 * Create a complete SIWX payload from server extension info.
 *
 * Routes to EVM or Solana signing based on the chainId prefix:
 * - `eip155:*` → EVM signing
 * - `solana:*` → Solana signing
 *
 * @param serverExtension - Server-provided extension info from PaymentRequired
 * @param signer - Wallet that can sign messages (EVMSigner or SolanaSigner)
 * @returns Complete SIWX payload with signature
 *
 * @example
 * ```typescript
 * // EVM wallet
 * const payload = await createSIWxPayload(serverInfo, evmWallet);
 *
 * // Solana wallet
 * const payload = await createSIWxPayload(serverInfo, solanaSigner);
 * ```
 */
export async function createSIWxPayload(
  serverExtension: SIWxExtensionInfo,
  signer: SIWxSigner,
): Promise<SIWxPayload> {
  const isSolana = serverExtension.chainId.startsWith("solana:");

  // Get address and sign based on chain type
  const address = isSolana
    ? getSolanaAddress(signer as SolanaSigner)
    : getEVMAddress(signer as EVMSigner);

  const message = createSIWxMessage(serverExtension, address);

  const signature = isSolana
    ? await signSolanaMessage(message, signer as SolanaSigner)
    : await signEVMMessage(message, signer as EVMSigner);

  return {
    domain: serverExtension.domain,
    address,
    statement: serverExtension.statement,
    uri: serverExtension.uri,
    version: serverExtension.version,
    chainId: serverExtension.chainId,
    type: serverExtension.type,
    nonce: serverExtension.nonce,
    issuedAt: serverExtension.issuedAt,
    expirationTime: serverExtension.expirationTime,
    notBefore: serverExtension.notBefore,
    requestId: serverExtension.requestId,
    resources: serverExtension.resources,
    signatureScheme: serverExtension.signatureScheme,
    signature,
  };
}
