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
import {
  getMcpUserByWallet,
  upsertMcpUser,
  upsertMcpUserSchema,
} from '@/services/db/mcp-users';
import { getBuyerStats } from '@/services/transfers/buyers/stats/overall';
import { getBuyerStatsBucketed } from '@/services/transfers/buyers/stats/bucketed';
import { getBuyerStatsAggregated } from '@/services/transfers/buyers/stats/aggregated';
import { getBuyerResourceUsage } from '@/services/transfers/buyers/stats/resources';
import { getAcceptsAddresses } from '@/services/db/resources/accepts';
import { usdc } from '@/lib/tokens/usdc';
import { convertTokenAmount } from '@/lib/token';
import { env } from '@/env';
import { Chain } from '@/types/chain';
import { timeframeSchema, timePeriodSchema } from '@/lib/schemas';

export const adminUsersRouter = createTRPCRouter({
  list: adminProcedure.input(listMcpUsersSchema).query(async ({ input }) => {
    const { sortBy, sortDesc = true, limit = 50, offset = 0 } = input ?? {};
    const isBuyerStatSort =
      sortBy === 'totalSpent' || sortBy === 'transactionCount';

    // For buyer stat sorting, we need to get all users first then sort
    const queryInput = isBuyerStatSort
      ? { ...input, limit: 1000, offset: 0 }
      : input;

    const users = await listMcpUsers(queryInput);

    // Get buyer stats for all wallets in parallel
    const wallets = users.map(u => u.recipientAddr);
    const buyerStats = await getBuyerStatsAggregated({ wallets });

    // Create a map for fast lookup (lowercase keys for case-insensitive matching)
    const buyerStatsMap = new Map(
      buyerStats.map(s => [s.sender.toLowerCase(), s])
    );

    // Merge buyer stats into user data
    const merged = users.map(user => {
      const stats = buyerStatsMap.get(user.recipientAddr.toLowerCase());
      return {
        ...user,
        totalSpent: stats?.total_amount ?? 0,
        transactionCount: stats?.total_transactions ?? 0,
      };
    });

    // If sorting by buyer stats field, sort and paginate in memory
    if (isBuyerStatSort && sortBy) {
      const sorted = merged.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        return sortDesc ? bVal - aVal : aVal - bVal;
      });
      return sorted.slice(offset, offset + limit);
    }

    return merged;
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

      const [usdcBalanceRaw, ethBalanceRaw, redemptions, mcpUser] =
        await Promise.all([
          readContract(client, {
            abi: erc20Abi,
            address: token.address as `0x${string}`,
            args: [wallet],
            functionName: 'balanceOf',
          }),
          getBalance(client, { address: wallet }),
          getRedemptionsByWallet(wallet),
          getMcpUserByWallet(wallet),
        ]);

      const firstRedemption = redemptions.at(-1);

      return {
        valid: true,
        wallet,
        name: mcpUser?.name ?? null,
        metadata: mcpUser?.metadata as Record<string, unknown> | null,
        usdcBalance: convertTokenAmount(usdcBalanceRaw),
        ethBalance: Number(ethBalanceRaw) / 1e18,
        redemptions: redemptions.map(r => ({
          id: r.id,
          amount: convertTokenAmount(r.amount),
          code: r.inviteCode.code,
          createdBy:
            r.inviteCode.createdBy.email ?? r.inviteCode.createdBy.name,
          redeemedAt: r.createdAt,
          txHash: r.txHash,
        })),
        firstSeen: firstRedemption?.createdAt ?? null,
      };
    }),

  update: adminProcedure
    .input(upsertMcpUserSchema)
    .mutation(async ({ input }) => {
      return upsertMcpUser(input);
    }),

  buyerStats: adminProcedure
    .input(z.object({ wallet: z.string(), timeframe: timeframeSchema }))
    .query(async ({ input }) => {
      return getBuyerStats(input);
    }),

  buyerStatsBucketed: adminProcedure
    .input(
      z.object({
        wallet: z.string(),
        timeframe: timePeriodSchema,
        numBuckets: z.number().default(48),
      })
    )
    .query(async ({ input }) => {
      return getBuyerStatsBucketed(input);
    }),

  buyerResourceUsage: adminProcedure
    .input(
      z.object({
        wallet: z.string(),
        timeframe: timeframeSchema,
        limit: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      const resourceUsage = await getBuyerResourceUsage(input);

      // Get origin data for the recipient addresses
      const originsByAddress = await getAcceptsAddresses({});

      // Merge origin data into resource usage
      return resourceUsage.map(item => ({
        ...item,
        origins: originsByAddress[item.recipient] ?? [],
      }));
    }),
});
