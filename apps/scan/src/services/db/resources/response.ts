import { prisma } from '../client';

import type { ParsedX402Response } from '@/lib/x402/schema';

export const upsertResourceResponse = async (
  resourceId: string,
  response: ParsedX402Response
) => {
  return await prisma.resourceResponse.upsert({
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
  return await prisma.resourceResponse.deleteMany({
    where: {
      resourceId,
    },
  });
};
