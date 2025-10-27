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
