import { prisma } from '../client';

import { mixedAddressSchema } from '@/lib/schemas';

import type { Chain } from '@/types/chain';
import type { AcceptsNetwork, ResourceOrigin } from '@prisma/client';

export const getAcceptsAddresses = async (chain?: Chain) => {
  const accepts = await prisma.accepts.findMany({
    include: {
      resourceRel: {
        select: {
          origin: true,
          _count: true,
        },
      },
    },
    where: {
      network: chain as AcceptsNetwork,
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
          const existingOrigin = acc[accept.payTo].find(
            origin => origin.id === accept.resourceRel.origin.id
          );
          if (!existingOrigin) {
            acc[accept.payTo].push(accept.resourceRel.origin);
          }
        } else {
          acc[accept.payTo] = [accept.resourceRel.origin];
        }
        return acc;
      },
      {} as Record<string, Array<ResourceOrigin>>
    );
};
