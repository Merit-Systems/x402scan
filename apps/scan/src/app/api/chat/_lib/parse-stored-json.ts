import z from "zod";

import type { Prisma } from "@x402scan/scan-db";

export const parseStoredJson = (value: Prisma.JsonValue): unknown => {
  const encoded = z.string().parse(value);
  const parsed: unknown = JSON.parse(encoded);
  return parsed;
};
