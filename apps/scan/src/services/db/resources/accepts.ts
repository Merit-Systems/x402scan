import { Prisma } from "@x402scan/scan-db";
import { z } from "zod";

import { createCachedArrayQuery, createStandardCacheKey } from "@/lib/cache";
import { mixedAddressSchema } from "@/lib/schemas";
import { queryRaw } from "@/services/db/query";

import type { Chain } from "@/types/chain";

interface GetAcceptsAddressesInput {
  chain?: Chain;
  tags?: string[];
  originUrls?: string[];
}

const acceptsOriginRowSchema = z.object({
  payTo: z.string(),
  id: z.string(),
  origin: z.string(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  favicon: z.string().nullable(),
});

type AcceptsOriginRow = z.infer<typeof acceptsOriginRowSchema>;
type AcceptsOrigin = Omit<AcceptsOriginRow, "payTo">;

const listAcceptsOriginsUncached = async (input: GetAcceptsAddressesInput) => {
  const t0 = performance.now();
  const { chain, tags, originUrls } = input;

  const chainFilter = chain
    ? Prisma.sql`AND a.network = ${chain}::"AcceptsNetwork"`
    : Prisma.empty;
  const tagsFilter = tags
    ? Prisma.sql`
        AND EXISTS (
          SELECT 1
          FROM "ResourcesTags" rt
          JOIN "Tag" t ON t.id = rt."tagId"
          WHERE rt."resourceId" = r.id
            AND t.name = ANY(${tags}::text[])
        )
      `
    : Prisma.empty;
  const originUrlsFilter = originUrls
    ? Prisma.sql`
        AND EXISTS (
          SELECT 1
          FROM "ResourceOrigin" filtered_origin
          WHERE filtered_origin.id = r."originId"
            AND filtered_origin.origin = ANY(${originUrls}::text[])
        )
      `
    : Prisma.empty;

  const rows = await queryRaw(
    Prisma.sql`
      WITH mappings AS (
        SELECT DISTINCT
          a."payTo",
          r."originId"
        FROM "Accepts" a
        JOIN "Resources" r ON r.id = a."resourceId"
        WHERE r."deprecatedAt" IS NULL
          ${chainFilter}
          ${tagsFilter}
          ${originUrlsFilter}
      )
      SELECT
        mappings."payTo" AS "payTo",
        o.id,
        o.origin,
        o.title,
        o.description,
        o.favicon
      FROM mappings
      JOIN "ResourceOrigin" o ON o.id = mappings."originId"
      ORDER BY mappings."payTo", o.origin
    `,
    z.array(acceptsOriginRowSchema)
  );

  console.log(
    `[accepts] distinct query=${(performance.now() - t0).toFixed(0)}ms (${rows.length} mappings)`
  );

  return rows;
};

const listAcceptsOrigins = createCachedArrayQuery({
  queryFn: listAcceptsOriginsUncached,
  cacheKeyPrefix: "accepts-origin-mappings",
  createCacheKey: createStandardCacheKey,
  dateFields: [],
  tags: ["resources"],
});

export const getAcceptsAddresses = async (input: GetAcceptsAddressesInput) => {
  const rows = await listAcceptsOrigins(input);

  return rows.reduce<Record<string, AcceptsOrigin[]>>(
    (originsByAddress, row) => {
      if (!mixedAddressSchema.safeParse(row.payTo).success) {
        return originsByAddress;
      }

      const { payTo, ...origin } = row;
      (originsByAddress[payTo] ??= []).push(origin);
      return originsByAddress;
    },
    {}
  );
};
