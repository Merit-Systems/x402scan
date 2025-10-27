import { NextResponse, type NextRequest } from "next/server";
import { checkCronSecret } from '@/lib/cron';
import type { Prisma } from '@prisma/client';
import { CdpClient } from "@coinbase/cdp-sdk";
import { createWalletSnapshot } from "@/services/db/wallet-snapshot/create";

const USDC_TOKEN_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`;
const NETWORK = "base"; // Base mainnet

interface WalletSnapshot {
    accountName: string;
    accountAddress: string;
    amount: bigint;
}

export const GET = async (request: NextRequest) => {
    const cronCheck = checkCronSecret(request);
    if (cronCheck) {
        return cronCheck;
      }
      const cdp = new CdpClient();
      const snapshots: WalletSnapshot[] = [];
      try {
        let response = await cdp.evm.listAccounts();
        while (true) {
            // Iterate over accounts
            for (const account of response.accounts) {
                try {
                const balanceResult = await account.listTokenBalances({ network: NETWORK as any });
                const usdcBalance = balanceResult.balances.find((b: any) => 
                    b.token?.contractAddress?.toLowerCase() === USDC_TOKEN_ADDRESS.toLowerCase()
                  );
                  if (usdcBalance && usdcBalance.amount && usdcBalance.amount.amount > 0n) {
                    const amount = usdcBalance.amount.amount;
                    snapshots.push({
                        accountName: account.name,
                        accountAddress: account.address,
                        amount: amount,
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
      } catch (error) {
        console.error('Error listing accounts:', error);
        return NextResponse.json({ error: 'Failed to list accounts' }, { status: 500 });
      }
      return NextResponse.json({ success: true });
} 
