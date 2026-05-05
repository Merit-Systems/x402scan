import { scanDb } from '@x402scan/scan-db';

import type { Prisma } from '@x402scan/scan-db';
import type { ParsedX402Response } from '@/lib/x402';

export const upsertResourceResponse = async (
  resourceId: string,
  response: ParsedX402Response
) => {
  // Cast: the parsed response is JSON-safe by construction, but its inferred
  // type uses unknown-valued records that Prisma's structural InputJsonValue
  // can't validate without an index signature.
  const responseJson = response as unknown as Prisma.InputJsonValue;
  return await scanDb.resourceResponse.upsert({
    where: {
      resourceId,
    },
    update: {
      resourceId,
      response: responseJson,
    },
    create: {
      resourceId,
      response: responseJson,
    },
  });
};

export const deleteResourceResponse = async (resourceId: string) => {
  return await scanDb.resourceResponse.deleteMany({
    where: {
      resourceId,
    },
  });
};
