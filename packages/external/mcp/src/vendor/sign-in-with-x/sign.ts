/**
 * Message signing for SIWX extension
 *
 * Client-side helpers for signing SIWX messages.
 * Supports both EVM (viem) and Solana wallet adapters.
 */

import { encodeBase58 } from "./solana";

/**
 * Signer interface for EVM SIWX message signing.
 * Compatible with viem WalletClient and PrivateKeyAccount.
 */
export interface EVMSigner {
  /** Sign a message and return hex-encoded signature */
  signMessage: (args: { message: string; account?: unknown }) => Promise<string>;
  /** Account object (for WalletClient) */
  account?: { address: string };
  /** Direct address (for PrivateKeyAccount) */
  address?: string;
}

/**
 * Signer interface for Solana SIWX message signing.
 * Compatible with @solana/wallet-adapter and Phantom/Solflare wallet APIs.
 */
export interface SolanaSigner {
  /** Sign a message and return raw signature bytes */
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  /** Solana public key (Base58 encoded string or PublicKey-like object) */
  publicKey: string | { toBase58: () => string };
}

/**
 * Union type for SIWX signers - supports both EVM and Solana wallets.
 */
export type SIWxSigner = EVMSigner | SolanaSigner;

/**
 * Get address from an EVM signer.
 *
 * @param signer - EVM wallet signer instance
 * @returns The wallet address as a hex string
 */
export function getEVMAddress(signer: EVMSigner): string {
  if (signer.account?.address) {
    return signer.account.address;
  }
  if (signer.address) {
    return signer.address;
  }
  throw new Error("EVM signer missing address");
}

/**
 * Get address from a Solana signer.
 *
 * @param signer - Solana wallet signer instance
 * @returns The wallet address as a Base58 string
 */
export function getSolanaAddress(signer: SolanaSigner): string {
  const pk = signer.publicKey;
  return typeof pk === "string" ? pk : pk.toBase58();
}

/**
 * Sign a message with an EVM wallet.
 * Returns hex-encoded signature.
 *
 * @param message - The message to sign
 * @param signer - EVM wallet signer instance
 * @returns Hex-encoded signature
 */
export async function signEVMMessage(message: string, signer: EVMSigner): Promise<string> {
  if (signer.account) {
    return signer.signMessage({ message, account: signer.account });
  }
  return signer.signMessage({ message });
}

/**
 * Sign a message with a Solana wallet.
 * Returns Base58-encoded signature.
 *
 * @param message - The message to sign
 * @param signer - Solana wallet signer instance
 * @returns Base58-encoded signature
 */
export async function signSolanaMessage(message: string, signer: SolanaSigner): Promise<string> {
  const messageBytes = new TextEncoder().encode(message);
  const signatureBytes = await signer.signMessage(messageBytes);
  return encodeBase58(signatureBytes);
}
