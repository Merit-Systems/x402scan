'use client';

import { useMemo } from 'react';
import { api } from '@/trpc/client';

interface OwnershipResult {
  ownershipProofs: string[];
  ownershipVerified: boolean;
  recoveredAddresses: string[];
  verifiedAddresses: Record<string, boolean>;
  isVerifyingOwnership: boolean;
}

/**
 * Hook for ownership verification.
 * Isolated to handle ESLint type inference issues with tRPC discriminated unions.
 */
export function useOwnership(
  discoveryData:
    | { found: true; ownershipProofs?: string[] }
    | { found: false }
    | undefined,
  urlOrigin: string | null,
  payToAddresses: string[]
): OwnershipResult {
  // Extract ownership proofs from discovery data
  const ownershipProofs: string[] = useMemo(() => {
    if (!discoveryData) return [];
    if (!discoveryData.found) return [];
    return discoveryData.ownershipProofs ?? [];
  }, [discoveryData]);

  // Verify ownership proofs against payTo addresses
  const ownershipQuery = api.public.resources.verifyOwnership.useQuery(
    {
      ownershipProofs,
      origin: urlOrigin!,
      payToAddresses,
    },
    {
      enabled:
        !!urlOrigin && ownershipProofs.length > 0 && payToAddresses.length > 0,
      staleTime: 60000,
    }
  );

  const verifiedAddresses: Record<string, boolean> =
    ownershipQuery.data?.verifiedAddresses ?? {};

  return {
    ownershipProofs,
    ownershipVerified: Boolean(ownershipQuery.data?.verified),
    recoveredAddresses: ownershipQuery.data?.recoveredAddresses ?? [],
    verifiedAddresses,
    isVerifyingOwnership: ownershipQuery.isLoading,
  };
}
