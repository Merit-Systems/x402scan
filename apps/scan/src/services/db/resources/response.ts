import { scanDb } from "@x402scan/scan-db";

import type { Prisma } from "@x402scan/scan-db";
import type { ParsedX402Response } from "@/lib/x402";
import { jsonObjectSchema } from "@/lib/json";

const toPrismaJson = (response: ParsedX402Response): Prisma.InputJsonValue => {
  const serialized = JSON.stringify(response);
  const parsed = jsonObjectSchema.safeParse(JSON.parse(serialized));
  if (!parsed.success) {
    throw new Error("Parsed x402 response is not JSON-safe");
  }
  return parsed.data;
};

export const upsertResourceResponse = async (
  resourceId: string,
  response: ParsedX402Response
) => {
  const responseJson = toPrismaJson(response);
  return scanDb.resourceResponse.upsert({
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
  return scanDb.resourceResponse.deleteMany({
    where: {
      resourceId,
    },
  });
};
