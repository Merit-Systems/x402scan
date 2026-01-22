import { z } from 'zod';
import { erc20Abi, createPublicClient, http, isAddress } from 'viem';
import { getBalance, readContract } from 'viem/actions';
import { base } from 'viem/chains';

import { createTRPCRouter, adminProcedure } from '../../trpc';
import {
  getRedemptionsByWallet,
  listMcpUsers,
  listMcpUsersSchema,
} from '@/services/db/invite-codes/query';
import { usdc } from '@/lib/tokens/usdc';
import { convertTokenAmount } from '@/lib/token';
import { env } from '@/env';
import { Chain } from '@/types/chain';

export const adminUsersRouter = createTRPCRouter({
  list: adminProcedure
    .input(listMcpUsersSchema)
    .query(async ({ input }) => {
      return listMcpUsers(input);
    }),

  getByWallet: adminProcedure
    .input(z.object({ wallet: z.string() }))
    .query(async ({ input }) => {
      const { wallet } = input;

      if (!isAddress(wallet)) {
        return {
          valid: false,
          error: 'Invalid wallet address',
        };
      }

      const token = usdc(Chain.BASE);
      const client = createPublicClient({
        chain: base,
        transport: http(env.NEXT_PUBLIC_BASE_RPC_URL),
      });

      const [usdcBalanceRaw, ethBalanceRaw, redemptions] = await Promise.all([
        readContract(client, {
          abi: erc20Abi,
          address: token.address as `0x${string}`,
          args: [wallet as `0x${string}`],
          functionName: 'balanceOf',
        }),
        getBalance(client, { address: wallet as `0x${string}` }),
        getRedemptionsByWallet(wallet),
      ]);

      const firstRedemption = redemptions.at(-1);

      return {
        valid: true,
        wallet,
        usdcBalance: convertTokenAmount(usdcBalanceRaw),
        ethBalance: Number(ethBalanceRaw) / 1e18,
        redemptions: redemptions.map(r => ({
          id: r.id,
          amount: convertTokenAmount(r.amount),
          code: r.inviteCode.code,
          createdBy: r.inviteCode.createdBy.email ?? r.inviteCode.createdBy.name,
          redeemedAt: r.createdAt,
          txHash: r.txHash,
        })),
        firstSeen: firstRedemption?.createdAt ?? null,
      };
    }),
});
