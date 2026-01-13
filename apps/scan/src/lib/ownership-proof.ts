/**
 * Ownership Proof Verification
 *
 * Verifies that an ownership proof signature was signed by a payTo address.
 * The signed message is the origin string (e.g., "https://api.example.com").
 */

import { recoverMessageAddress, type Address } from 'viem';

/**
 * Verify an ownership proof signature against a payTo address.
 *
 * @param signature - The signature (hex string with 0x prefix)
 * @param origin - The origin string that was signed
 * @param payToAddress - The expected signer address (payTo from resource accepts)
 * @returns true if signature was signed by the payTo address
 */
export async function verifyOwnershipProof(
  signature: `0x${string}`,
  origin: string,
  payToAddress: Address
): Promise<boolean> {
  try {
    const recoveredAddress = await recoverMessageAddress({
      message: origin,
      signature,
    });

    return recoveredAddress.toLowerCase() === payToAddress.toLowerCase();
  } catch {
    return false;
  }
}

export interface OwnershipVerificationResult {
  verified: boolean;
  /** Addresses recovered from the ownership proof signatures */
  recoveredAddresses: string[];
}

/**
 * Recover the signer address from an ownership proof signature.
 */
export async function recoverProofSigner(
  signature: `0x${string}`,
  origin: string
): Promise<string | null> {
  try {
    const recoveredAddress = await recoverMessageAddress({
      message: origin,
      signature,
    });
    return recoveredAddress;
  } catch {
    return null;
  }
}

/**
 * Verify any of the ownership proofs matches any of the payTo addresses.
 *
 * @param ownershipProofs - Array of signature strings
 * @param origin - The origin string that was signed
 * @param payToAddresses - Array of payTo addresses from resource accepts
 * @returns Verification result with recovered addresses for debugging mismatches
 */
export async function verifyAnyOwnershipProof(
  ownershipProofs: string[],
  origin: string,
  payToAddresses: string[]
): Promise<OwnershipVerificationResult> {
  const recoveredAddresses: string[] = [];

  for (const proof of ownershipProofs) {
    // Skip if not a valid hex signature
    if (!proof.startsWith('0x')) continue;

    const recovered = await recoverProofSigner(proof as `0x${string}`, origin);
    if (recovered) {
      recoveredAddresses.push(recovered);

      // Check if it matches any payTo address
      for (const payTo of payToAddresses) {
        if (!payTo.startsWith('0x')) continue;
        if (recovered.toLowerCase() === payTo.toLowerCase()) {
          return { verified: true, recoveredAddresses };
        }
      }
    }
  }

  return { verified: false, recoveredAddresses };
}
