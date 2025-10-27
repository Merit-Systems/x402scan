import { NextResponse, type NextRequest } from "next/server";
import { checkCronSecret } from '@/lib/cron';
import { CdpClient } from "@coinbase/cdp-sdk";
import { createWalletSnapshots } from "@/services/db/wallet-snapshot/create";
import type { z } from "zod";
import type { walletSnapshotInputSchema } from "@/services/db/wallet-snapshot/create";

const USDC_TOKEN_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`;
const NETWORK = "base";

export const GET = async (request: NextRequest) => {
  const cronCheck = checkCronSecret(request);
  if (cronCheck) {
    return cronCheck;
  }

  const cdp = new CdpClient();
  const snapshots: z.infer<typeof walletSnapshotInputSchema>[] = [];

  try {
    let response = await cdp.evm.listAccounts();

    while (true) {
      for (const account of response.accounts) {
        try {
          const balanceResult = await account.listTokenBalances({ network: NETWORK as any });
          const usdcBalance = balanceResult.balances.find((b: any) => 
            b.token?.contractAddress?.toLowerCase() === USDC_TOKEN_ADDRESS.toLowerCase()
          );

          if (usdcBalance && usdcBalance.amount && usdcBalance.amount.amount > 0n) {
            snapshots.push({
              accountName: account.name ?? account.address,
              accountAddress: account.address,
              amount: usdcBalance.amount.amount,
            });
          }
        } catch (error) {
          console.error('Error listing token balances for account:', account.address, ':', error);
          continue;
        }
      }
      if (!response.nextPageToken) break;

      response = await cdp.evm.listAccounts({
        pageToken: response.nextPageToken
      });
    }
    // Process snapshots in batches of 100
    for (let i = 0; i < snapshots.length; i += 100) {
      const batch = snapshots.slice(i, i + 100);
      try {
        await createWalletSnapshots({ snapshots: batch });
      } catch (error) {
        console.error('Error creating wallet snapshots batch:', error);
        continue;
      }
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error listing accounts:', error);
    return NextResponse.json({ error: 'Failed to list accounts' }, { status: 500 });
  }
}
