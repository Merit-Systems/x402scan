import { scanDb } from '@x402scan/scan-db';

import { mixedAddressSchema } from '@/lib/schemas';

import type { Chain } from '@/types/chain';
import type { AcceptsNetwork, ResourceOrigin } from '@x402scan/scan-db';

interface GetAcceptsAddressesInput {
  chain?: Chain;
  tags?: string[];
  originUrls?: string[];
}

export const getAcceptsAddresses = async (input: GetAcceptsAddressesInput) => {
  const t0 = performance.now();
  const { chain, tags, originUrls } = input;
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
      ...(tags || originUrls
        ? {
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
              ...(originUrls
                ? {
                    origin: {
                      origin: { in: originUrls },
                    },
                  }
                : {}),
            },
          }
        : {}),
    },
  });

  const tQuery = performance.now();
  console.log(
    `[accepts] prisma query=${(tQuery - t0).toFixed(0)}ms (${accepts.length} rows)`
  );

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
