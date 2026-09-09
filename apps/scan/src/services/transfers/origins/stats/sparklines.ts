import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";

import { Prisma } from "@x402scan/transfers-db";

import { QUERY_CACHE_LIFE } from "@/lib/cache/constants";
import { chainSchema, timeframeSchema } from "@/lib/schemas";
import { getMaterializedViewSuffix } from "@/lib/time-range";
import { queryRaw } from "@/services/transfers/client";

import {
  buildOriginTransactionSparklines,
  recipientTransactionSparklineRowSchema,
} from "./sparkline-values";

import type { OriginRecipientGroup } from "./sparkline-values";

const recipientTransactionSparklinesInputSchema = z.object({
  chain: chainSchema.optional(),
  recipients: z.array(z.string()),
  timeframe: timeframeSchema,
});

type RecipientTransactionSparklinesInput = z.infer<
  typeof recipientTransactionSparklinesInputSchema
>;

const listRecipientTransactionSparklineRows = async (
  input: RecipientTransactionSparklinesInput
) => {
  "use cache: remote";
  cacheLife(QUERY_CACHE_LIFE);
  cacheTag("statistics", "recipients");

  if (input.recipients.length === 0) return [];

  const tableName = `recipient_stats_bucketed_${getMaterializedViewSuffix(input.timeframe)}`;
  const chainFilter = input.chain
    ? Prisma.sql`AND chain = ${input.chain}`
    : Prisma.empty;
  const sql = Prisma.sql`
      SELECT
        recipient,
        bucket,
        COALESCE(SUM(total_transactions), 0)::int AS transactions
      FROM ${Prisma.raw(tableName)}
      WHERE recipient = ANY(${input.recipients}::text[])
      ${chainFilter}
      GROUP BY recipient, bucket
      ORDER BY recipient, bucket ASC
    `;

  return queryRaw(sql, z.array(recipientTransactionSparklineRowSchema));
};

export async function getOriginTransactionSparklines(input: {
  chain?: RecipientTransactionSparklinesInput["chain"];
  groups: OriginRecipientGroup[];
  timeframe: RecipientTransactionSparklinesInput["timeframe"];
}) {
  const recipients = [
    ...new Set(input.groups.flatMap((group) => group.recipients)),
  ];
  if (input.groups.length === 0) return {};

  try {
    const rows = await listRecipientTransactionSparklineRows({
      chain: input.chain,
      recipients,
      timeframe: input.timeframe,
    });
    return buildOriginTransactionSparklines(input.groups, rows);
  } catch (error) {
    console.error("[origin-sparklines] query failed", {
      originCount: input.groups.length,
      timeframe: input.timeframe,
      error,
    });
    return Object.fromEntries(
      input.groups.map(({ originId }) => [originId, []])
    );
  }
}
