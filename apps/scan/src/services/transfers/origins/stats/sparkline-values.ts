import { z } from "zod";

export interface OriginRecipientGroup {
  originId: string;
  recipients: string[];
}

export const recipientTransactionSparklineRowSchema = z.object({
  recipient: z.string(),
  bucket: z.date(),
  transactions: z.number(),
});

export type RecipientTransactionSparklineRow = z.infer<
  typeof recipientTransactionSparklineRowSchema
>;

export function buildOriginTransactionSparklines(
  groups: OriginRecipientGroup[],
  rows: RecipientTransactionSparklineRow[]
) {
  const originIdsByRecipient = new Map<string, string[]>();
  for (const group of groups) {
    for (const recipient of group.recipients) {
      const originIds = originIdsByRecipient.get(recipient) ?? [];
      originIds.push(group.originId);
      originIdsByRecipient.set(recipient, originIds);
    }
  }

  const relevantRows = rows.filter((row) =>
    originIdsByRecipient.has(row.recipient)
  );
  const buckets = [
    ...new Set(relevantRows.map((row) => row.bucket.getTime())),
  ].sort((a, b) => a - b);
  const indexByBucket = new Map(
    buckets.map((bucket, index) => [bucket, index])
  );
  const valuesByOrigin = Object.fromEntries(
    groups.map(({ originId }) => [
      originId,
      Array<number>(buckets.length).fill(0),
    ])
  );

  for (const row of relevantRows) {
    const index = indexByBucket.get(row.bucket.getTime());
    if (index === undefined) continue;

    for (const originId of originIdsByRecipient.get(row.recipient) ?? []) {
      const values = valuesByOrigin[originId];
      if (values) values[index] = (values[index] ?? 0) + row.transactions;
    }
  }

  return valuesByOrigin;
}
