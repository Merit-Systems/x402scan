import { scanDb } from '@x402scan/scan-db';

import type { Prisma } from '@x402scan/scan-db';
import type { ParsedX402Response } from '@/lib/x402';

const toPrismaJson = (response: ParsedX402Response): Prisma.InputJsonValue => {
  // Parsed x402 responses are JSON-safe by schema validation, but Prisma's
  // structural JSON input type requires nested objects to have index signatures.
  return response as unknown as Prisma.InputJsonValue;
};

export const upsertResourceResponse = async (
  resourceId: string,
  response: ParsedX402Response
) => {
  const responseJson = toPrismaJson(response);
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
