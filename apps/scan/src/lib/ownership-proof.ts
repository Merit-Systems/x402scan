/**
 * Ownership Proof Verification
 *
 * Verifies that an ownership proof signature was signed by a payTo address.
 * The signed message is the origin string (e.g., "https://api.example.com").
 *
 * Supports both EVM (Ethereum) and Solana addresses.
 */

import { isHex, recoverMessageAddress } from "viem";

type ChainType = "evm" | "solana";

interface VerificationConfig {
  signature: string;
  message: string;
  expectedAddress: string;
  chainType: ChainType;
}

interface ChainVerifier {
  verify(config: VerificationConfig): Promise<boolean>;
  recoverAddress(signature: string, message: string): Promise<string | null>;
}

/**
 * Detect chain type from address format.
 *
 * @param address - The address to check
 * @returns 'evm' for Ethereum addresses, 'solana' for Solana addresses
 */
function detectChainType(address: string): ChainType {
  // EVM: 0x + 40 hex chars
  if (/^0x[a-fA-F0-9]{40}$/i.test(address)) {
    return "evm";
  }

  // Solana: 32-44 base58 chars (no 0, O, I, l)
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
    return "solana";
  }

  // Default to EVM for backward compatibility
  return "evm";
}

/**
 * Normalize signature format for EVM.
 * Ensures 0x prefix is present.
 */
function normalizeEvmSignature(signature: string): `0x${string}` {
  if (isHex(signature)) return signature;
  return `0x${signature}`;
}

/**
 * EVM (Ethereum) Verifier using viem
 */
class EVMVerifier implements ChainVerifier {
  async verify(config: VerificationConfig): Promise<boolean> {
    try {
      const signature = normalizeEvmSignature(config.signature);
      const recoveredAddress = await recoverMessageAddress({
        message: config.message,
        signature,
      });

      return (
        recoveredAddress.toLowerCase() === config.expectedAddress.toLowerCase()
      );
    } catch {
      return false;
    }
  }

  async recoverAddress(
    signature: string,
    message: string
  ): Promise<string | null> {
    try {
      const normalizedSig = normalizeEvmSignature(signature);
      const recoveredAddress = await recoverMessageAddress({
        message,
        signature: normalizedSig,
      });
      return recoveredAddress;
    } catch {
      return null;
    }
  }
}

/**
 * Solana Verifier using Ed25519 signatures
 *
 * Note: Requires @solana/web3.js and tweetnacl dependencies.
 * Solana uses Ed25519 signatures which don't support address recovery.
 * We can only verify a signature against a known address, not recover the address.
 */
class SolanaVerifier implements ChainVerifier {
  async verify(config: VerificationConfig): Promise<boolean> {
    try {
      // Import dependencies dynamically to avoid errors if not installed
      const nacl = await import("tweetnacl");
      const bs58 = await import("bs58");

      // Decode signature from base58 or hex
      let signatureBytes: Uint8Array;
      try {
        signatureBytes = bs58.default.decode(config.signature);
      } catch {
        // Try hex decoding as fallback
        const hex = config.signature.replace(/^0x/, "");
        signatureBytes = Uint8Array.from(Buffer.from(hex, "hex"));
      }

      // Convert message to bytes
      const messageBytes = new TextEncoder().encode(config.message);

      // Decode public key (address) from base58
      const publicKeyBytes = bs58.default.decode(config.expectedAddress);

      // Verify signature
      const verified = nacl.default.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKeyBytes
      );

      return verified;
    } catch (error) {
      console.error("Solana verification error:", error);
      return false;
    }
  }

  recoverAddress(): Promise<string | null> {
    // Solana Ed25519 signatures don't support address recovery
    // This is a fundamental difference from ECDSA (used by EVM)
    return Promise.resolve(null);
  }
}

// Verifier registry
const verifiers = {
  evm: new EVMVerifier(),
  solana: new SolanaVerifier(),
} satisfies Record<ChainType, ChainVerifier>;

/**
 * Get the appropriate verifier for a chain type
 */
function getVerifier(chainType: ChainType): ChainVerifier {
  return verifiers[chainType];
}

/**
 * Verify an ownership proof signature against a payTo address (multi-chain).
 *
 * @param signature - The signature (hex string with 0x prefix for EVM, base58 for Solana)
 * @param origin - The origin string that was signed
 * @param payToAddress - The expected signer address
 * @returns true if signature was signed by the payTo address
 */
export async function verifyOwnershipProofMultichain(
  signature: string,
  origin: string,
  payToAddress: string
): Promise<boolean> {
  const chainType = detectChainType(payToAddress);
  const verifier = getVerifier(chainType);

  return verifier.verify({
    signature,
    message: origin,
    expectedAddress: payToAddress,
    chainType,
  });
}
