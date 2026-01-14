import { scanDb } from '@x402scan/scan-db';

import { verifyOwnershipProofMultichain } from '@/lib/ownership-proof';

export interface VerificationResult {
  acceptId: string;
  verified: boolean;
  verifiedAddress?: string;
  verificationProof?: string;
  error?: string;
}

export interface VerifyAcceptsInput {
  acceptIds: string[];
  ownershipProofs: string[];
  origin: string;
}

/**
 * Verify ownership of multiple accepts using provided ownership proofs.
 *
 * This function:
 * 1. Fetches accepts from database by IDs
 * 2. For each accept, tries each ownership proof
 * 3. Updates database with verification results
 * 4. Returns detailed verification results
 *
 * @param input - Accept IDs, ownership proofs, and origin URL
 * @returns Array of verification results for each accept
 */
export async function verifyAcceptsOwnership(
  input: VerifyAcceptsInput
): Promise<VerificationResult[]> {
  const { acceptIds, ownershipProofs, origin } = input;

  // Skip if no proofs provided
  if (!ownershipProofs || ownershipProofs.length === 0) {
    return acceptIds.map(id => ({
      acceptId: id,
      verified: false,
      error: 'No ownership proofs provided',
    }));
  }

  // Fetch accepts from database
  const accepts = await scanDb.accepts.findMany({
    where: {
      id: {
        in: acceptIds,
      },
    },
    select: {
      id: true,
      payTo: true,
    },
  });

  // Process each accept
  const results: VerificationResult[] = [];

  for (const accept of accepts) {
    let verified = false;
    let verifiedAddress: string | undefined;
    let verificationProof: string | undefined;
    let error: string | undefined;

    // Skip if no payTo address
    if (!accept.payTo) {
      results.push({
        acceptId: accept.id,
        verified: false,
        error: 'No payTo address',
      });
      continue;
    }

    // Try each ownership proof
    for (const proof of ownershipProofs) {
      // Skip empty proofs
      if (!proof) continue;

      try {
        const isValid = await verifyOwnershipProofMultichain(
          proof,
          origin,
          accept.payTo
        );

        if (isValid) {
          verified = true;
          verifiedAddress = accept.payTo;
          verificationProof = proof;
          break; // Found valid proof, stop trying
        }
      } catch (err) {
        console.error(`Error verifying proof for accept ${accept.id}:`, err);
        error = err instanceof Error ? err.message : 'Verification error';
      }
    }

    // Update database with verification result
    if (verified) {
      await scanDb.accepts.update({
        where: { id: accept.id },
        data: {
          verified: true,
          verifiedAddress,
          verificationProof,
          verifiedAt: new Date(),
        },
      });
    } else {
      // Clear verification if previously verified but now fails
      await scanDb.accepts.update({
        where: { id: accept.id },
        data: {
          verified: false,
          verifiedAddress: null,
          verificationProof: null,
          verifiedAt: null,
        },
      });
    }

    results.push({
      acceptId: accept.id,
      verified,
      verifiedAddress,
      verificationProof,
      error: verified ? undefined : (error ?? 'No matching proof found'),
    });
  }

  return results;
}

/**
 * Get verification status for accepts of a resource.
 *
 * @param resourceId - Resource ID
 * @returns Counts of verified and total accepts
 */
export async function getResourceVerificationStatus(resourceId: string) {
  const accepts = await scanDb.accepts.findMany({
    where: {
      resourceId,
    },
    select: {
      verified: true,
    },
  });

  const total = accepts.length;
  const verified = accepts.filter(a => a.verified).length;

  return {
    verified,
    total,
    allVerified: total > 0 && verified === total,
    partiallyVerified: verified > 0 && verified < total,
    unverified: verified === 0,
  };
}

/**
 * Get verification status for all resources under an origin.
 *
 * @param originId - Origin ID
 * @returns Counts of verified and total accepts across all resources
 */
export async function getOriginVerificationStatus(originId: string) {
  const accepts = await scanDb.accepts.findMany({
    where: {
      resourceRel: {
        originId,
      },
    },
    select: {
      verified: true,
    },
  });

  const total = accepts.length;
  const verified = accepts.filter(a => a.verified).length;

  return {
    verified,
    total,
    allVerified: total > 0 && verified === total,
    partiallyVerified: verified > 0 && verified < total,
    unverified: verified === 0,
  };
}

/**
 * Re-verify all accepts for a resource using new ownership proofs.
 * Useful when ownership proofs are updated.
 *
 * @param resourceId - Resource ID
 * @param ownershipProofs - New ownership proofs
 * @param origin - Origin URL
 * @returns Verification results
 */
async function reverifyResourceAccepts(
  resourceId: string,
  ownershipProofs: string[],
  origin: string
): Promise<VerificationResult[]> {
  // Fetch all accepts for this resource
  const accepts = await scanDb.accepts.findMany({
    where: {
      resourceId,
    },
    select: {
      id: true,
    },
  });

  const acceptIds = accepts.map(a => a.id);

  return verifyAcceptsOwnership({
    acceptIds,
    ownershipProofs,
    origin,
  });
}
