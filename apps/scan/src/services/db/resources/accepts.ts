import { scanDb } from '@x402scan/scan-db';

import { mixedAddressSchema } from '@/lib/schemas';

import type { Chain } from '@/types/chain';
import type { AcceptsNetwork, ResourceOrigin } from '@x402scan/scan-db';

interface GetAcceptsAddressesInput {
  chain?: Chain;
  tags?: string[];
  excludeGamed?: boolean;
}

export const getAcceptsAddresses = async (input: GetAcceptsAddressesInput) => {
  const { chain, tags, excludeGamed } = input;
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
      resourceRel: {
        ...(tags
          ? {
              tags: {
                some: {
                  tag: { name: { in: tags } },
                },
              },
            }
          : {}),
        ...(excludeGamed ? { origin: { isGamed: false } } : {}),
      },
    },
  });

  return accepts
    .filter(accept => mixedAddressSchema.safeParse(accept.payTo).success)
    .reduce(
      (acc, accept) => {
        if (!accept.payTo) {
          return acc;
        }
        if (acc[accept.payTo]) {
          const existingOrigin = acc[accept.payTo]!.find(
            origin => origin.id === accept.resourceRel.origin.id
          );
          if (!existingOrigin) {
            acc[accept.payTo]!.push(accept.resourceRel.origin);
          }
        } else {
          acc[accept.payTo] = [accept.resourceRel.origin];
        }
        return acc;
      },
      {} as Record<string, ResourceOrigin[]>
    );
};
