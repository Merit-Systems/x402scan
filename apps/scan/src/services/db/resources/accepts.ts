import { scanDb } from '@x402scan/scan-db';

import { mixedAddressSchema } from '@/lib/schemas';

import type { Chain } from '@/types/chain';
import type { AcceptsNetwork, ResourceOrigin } from '@x402scan/scan-db';

interface GetAcceptsAddressesInput {
  chain?: Chain;
  tags?: string[];
  verified?: boolean;
}

export const getAcceptsAddresses = async (input: GetAcceptsAddressesInput) => {
  const { chain, tags, verified } = input;
  const accepts = await scanDb.accepts.findMany({
    include: {
      resourceRel: {
        select: {
          origin: true,
        },
      },
    },
    where: {
      network: chain as AcceptsNetwork,
      ...(verified !== undefined ? { verified } : {}),
      ...(tags
        ? {
            resourceRel: {
              tags: {
                some: {
                  tag: { name: { in: tags } },
                },
              },
            },
          }
        : {}),
    },
  });

  const addressToOrigins: Record<string, ResourceOrigin[]> = {};
  const originVerification = new Map<string, boolean>();

  accepts
    .filter(accept => mixedAddressSchema.safeParse(accept.payTo).success)
    .forEach(accept => {
      if (!accept.payTo) {
        return;
      }

      // Build address to origins map
      if (addressToOrigins[accept.payTo]) {
        const existingOrigin = addressToOrigins[accept.payTo]!.find(
          origin => origin.id === accept.resourceRel.origin.id
        );
        if (!existingOrigin) {
          addressToOrigins[accept.payTo]!.push(accept.resourceRel.origin);
        }
      } else {
        addressToOrigins[accept.payTo] = [accept.resourceRel.origin];
      }

      // Track verification status for each origin
      const originId = accept.resourceRel.origin.id;
      if (accept.verified) {
        originVerification.set(originId, true);
      } else if (!originVerification.has(originId)) {
        originVerification.set(originId, false);
      }
    });

  return {
    addressToOrigins,
    originVerification,
  };
};
