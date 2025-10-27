import { prisma } from "@/services/db/client";
import type { WalletSnapshot } from "@prisma/client";

export interface CreateWalletSnapshotInput {
  accountName?: string | null;
  accountAddress: string;
  network: string;
  usdcBalance: bigint;
  usdcBalanceDecimal: number;
  hasBalance: boolean;
  rawAccountData?: any;
}

/**
 * Creates a new wallet snapshot record in the database
 */
export async function createWalletSnapshot(
  input: CreateWalletSnapshotInput
): Promise<WalletSnapshot> {
  return prisma.walletSnapshot.create({
    data: {
      accountName: input.accountName,
      accountAddress: input.accountAddress,
      network: input.network,
      usdcBalance: input.usdcBalance,
      usdcBalanceDecimal: input.usdcBalanceDecimal,
      hasBalance: input.hasBalance,
      rawAccountData: input.rawAccountData,
    },
  });
}

