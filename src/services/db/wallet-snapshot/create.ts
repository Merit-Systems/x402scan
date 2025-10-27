import { prisma } from "@/services/db/client";
import type { Prisma } from "@prisma/client";

export interface WalletSnapshotInput {
  accountName: string;
  accountAddress: string;
  amount: bigint;
}

/**
 * Batch creates wallet snapshot records in the database in a single transaction
 */
export async function createWalletSnapshots(
  snapshots: WalletSnapshotInput[]
): Promise<Prisma.BatchPayload> {
  return prisma.walletSnapshot.createMany({
    data: snapshots,
  });
}

