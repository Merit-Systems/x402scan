import { scanDb } from '../../../../../../packages/internal/databases/scan/src';

import type { ParsedX402Response } from '@/lib/x402/schema';

export const upsertResourceResponse = async (
  resourceId: string,
  response: ParsedX402Response
) => {
  return await scanDb.resourceResponse.upsert({
    where: {
      resourceId,
    },
    update: {
      resourceId,
      response,
    },
    create: {
      resourceId,
      response,
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
