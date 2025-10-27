import z from 'zod';
import { prisma } from "@/services/db/client";
import type { Prisma } from "@prisma/client";

export const walletSnapshotInputSchema = z.object({
  accountName: z.string(),
  accountAddress: z.string(),
  amount: z.bigint(),
});

export const createWalletSnapshotsSchema = z.object({
  snapshots: z.array(walletSnapshotInputSchema).min(1),
});

/**
 * Batch creates wallet snapshot records in the database in a single transaction
 */
export async function createWalletSnapshots(
  input: z.infer<typeof createWalletSnapshotsSchema>
): Promise<Prisma.BatchPayload> {
  return prisma.walletSnapshot.createMany({
    data: input.snapshots,
  });
}

