import { scanDb } from '@x402scan/scan-db';

import { mixedAddressSchema } from '@/lib/schemas';

import type { Chain } from '@/types/chain';
import type { AcceptsNetwork, ResourceOrigin } from '@x402scan/scan-db';

interface GetAcceptsAddressesInput {
  chain?: Chain;
  tags?: string[];
}

export const getAcceptsAddresses = async (input: GetAcceptsAddressesInput) => {
  const { chain, tags } = input;
  const accepts = await scanDb.accepts.findMany({
    include: {
      resourceRel: {
        select: {
          _count: true,
          tags: true,
          origin: true,
        },
      },
    },
    where: {
      network: chain as AcceptsNetwork,
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
      {} as Record<string, Array<ResourceOrigin>>
    );
};
