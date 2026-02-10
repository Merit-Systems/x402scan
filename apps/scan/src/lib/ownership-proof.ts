/**
 * Ownership Proof Verification
 *
 * Verifies that an ownership proof signature was signed by a payTo address.
 * The signed message is the origin string (e.g., "https://api.example.com").
 *
 * Supports both EVM (Ethereum) and Solana addresses.
 * EVM verification supports EOA (ECDSA), EIP-1271 (smart contract wallets),
 * and EIP-6492 (counterfactual smart contract wallets) signatures.
 */

import { recoverMessageAddress } from 'viem';

import { baseRpc } from '@/services/rpc/base';

type ChainType = 'evm' | 'solana';

/** Subset of viem's PublicClient used for on-chain signature verification */
type EvmVerificationClient = {
  verifyMessage: (args: {
    address: `0x${string}`;
    message: string;
    signature: `0x${string}`;
  }) => Promise<boolean>;
};

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
    return 'evm';
  }

  // Solana: 32-44 base58 chars (no 0, O, I, l)
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
    return 'solana';
  }

  // Default to EVM for backward compatibility
  return 'evm';
}

/**
 * Normalize signature format for EVM.
 * Ensures 0x prefix is present.
 */
function normalizeEvmSignature(signature: string): `0x${string}` {
  if (signature.startsWith('0x')) {
    return signature as `0x${string}`;
  }
  return `0x${signature}`;
}

/**
 * EVM (Ethereum) Verifier using viem
 *
 * Supports EOA signatures via ECDSA recovery (fast, no RPC), with an
 * on-chain fallback via EIP-1271/EIP-6492 for smart contract wallets.
 */
class EVMVerifier implements ChainVerifier {
  private publicClient: EvmVerificationClient | null;

  constructor(publicClient?: EvmVerificationClient | null) {
    this.publicClient = publicClient ?? null;
  }

  async verify(config: VerificationConfig): Promise<boolean> {
    const signature = normalizeEvmSignature(config.signature);

    // 1. Try fast ECDSA recovery first (works for EOA signatures, no RPC needed)
    try {
      const recoveredAddress = await recoverMessageAddress({
        message: config.message,
        signature,
      });

      if (
        recoveredAddress.toLowerCase() === config.expectedAddress.toLowerCase()
      ) {
        return true;
      }
    } catch {
      // ECDSA recovery failed — signature may be from a smart contract wallet
    }

    // 2. Fall back to on-chain verification (EIP-1271 / EIP-6492)
    if (this.publicClient) {
      try {
        return await this.publicClient.verifyMessage({
          address: config.expectedAddress as `0x${string}`,
          message: config.message,
          signature,
        });
      } catch (error) {
        console.warn(
          `On-chain signature verification failed for ${config.expectedAddress}:`,
          error instanceof Error ? error.message : error
        );
        return false;
      }
    }

    return false;
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
      const nacl = await import('tweetnacl');
      const bs58 = await import('bs58');

      // Decode signature from base58 or hex
      let signatureBytes: Uint8Array;
      try {
        signatureBytes = bs58.default.decode(config.signature);
      } catch {
        // Try hex decoding as fallback
        const hex = config.signature.replace(/^0x/, '');
        signatureBytes = Uint8Array.from(Buffer.from(hex, 'hex'));
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
      console.error('Solana verification error:', error);
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
const verifiers: Record<ChainType, ChainVerifier> = {
  evm: new EVMVerifier(baseRpc),
  solana: new SolanaVerifier(),
};

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

export interface OwnershipVerificationResult {
  verified: boolean;
  /** Addresses recovered from the ownership proof signatures */
  recoveredAddresses: string[];
  /** Map of payTo address to whether it was verified */
  verifiedAddresses: Record<string, boolean>;
}

/**
 * Recover the signer address from an ownership proof signature (EVM only).
 *
 * @deprecated Use verifyOwnershipProofMultichain instead (Solana doesn't support recovery)
 */
async function recoverProofSigner(
  signature: `0x${string}`,
  origin: string
): Promise<string | null> {
  const verifier = getVerifier('evm');
  return verifier.recoverAddress(signature, origin);
}

/**
 * Verify any of the ownership proofs matches any of the payTo addresses (multi-chain).
 *
 * @param ownershipProofs - Array of signature strings
 * @param origin - The origin string that was signed
 * @param payToAddresses - Array of payTo addresses from resource accepts
 * @returns Verification result with per-address verification status and recovered addresses
 */
export async function verifyAnyOwnershipProof(
  ownershipProofs: string[],
  origin: string,
  payToAddresses: string[]
): Promise<OwnershipVerificationResult> {
  const recoveredAddresses: string[] = [];
  const verifiedAddresses: Record<string, boolean> = {};

  // Initialize all addresses as unverified
  for (const payTo of payToAddresses) {
    if (payTo) {
      verifiedAddresses[payTo] = false;
    }
  }

  // Check each proof against each address
  for (const proof of ownershipProofs) {
    // Skip empty proofs
    if (!proof) continue;

    // Try to match with each payTo address
    for (const payTo of payToAddresses) {
      if (!payTo) continue;

      const chainType = detectChainType(payTo);

      try {
        const isValid = await verifyOwnershipProofMultichain(
          proof,
          origin,
          payTo
        );

        if (isValid) {
          verifiedAddresses[payTo] = true;

          // For EVM, try to recover the address from signature
          if (chainType === 'evm' && proof.startsWith('0x')) {
            const recovered = await recoverProofSigner(
              proof as `0x${string}`,
              origin
            );
            if (recovered && !recoveredAddresses.includes(recovered)) {
              recoveredAddresses.push(recovered);
            }
          }

          // For Solana, add the verified payTo address (can't recover from signature)
          if (chainType === 'solana' && !recoveredAddresses.includes(payTo)) {
            recoveredAddresses.push(payTo);
          }
        }
      } catch (error) {
        console.error(
          `Verification error for ${chainType} address ${payTo}:`,
          error
        );
      }
    }

    // For EVM signatures that didn't match, still try to recover for debugging
    if (proof.startsWith('0x')) {
      const recovered = await recoverProofSigner(
        proof as `0x${string}`,
        origin
      );
      if (recovered && !recoveredAddresses.includes(recovered)) {
        recoveredAddresses.push(recovered);
      }
    }
  }

  // Overall verification is true if ANY address was verified
  const verified = Object.values(verifiedAddresses).some(v => v);

  return { verified, recoveredAddresses, verifiedAddresses };
}
