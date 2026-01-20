import { erc20Abi, formatEther, createPublicClient, http } from 'viem';
import { getBalance, readContract } from 'viem/actions';
import { base } from 'viem/chains';

import { createTRPCRouter, adminProcedure } from '../../trpc';

import { inviteCodeByIdSchema } from '@/services/db/invite-codes/schemas';
import {
  createInviteCode,
  listInviteCodes,
  getInviteCodeById,
  disableInviteCode,
  reactivateInviteCode,
  listInviteCodesSchema,
  updateMaxRedemptionsSchema,
  updateMaxRedemptions,
  createInviteCodeSchema,
} from '@/services/db/invite-codes';
import { inviteWallets } from '@/services/cdp/server-wallet/invite';

import { usdc } from '@/lib/tokens/usdc';
import { convertTokenAmount } from '@/lib/token';

import { env } from '@/env';

import { Chain } from '@/types/chain';

export const adminInviteCodesRouter = createTRPCRouter({
  list: adminProcedure.input(listInviteCodesSchema).query(async ({ input }) => {
    return listInviteCodes(input);
  }),

  getById: adminProcedure
    .input(inviteCodeByIdSchema)
    .query(async ({ input }) => {
      return getInviteCodeById(input);
    }),

  create: adminProcedure
    .input(createInviteCodeSchema)
    .mutation(async ({ ctx, input }) => {
      return createInviteCode(ctx.session.user.id, input);
    }),

  disable: adminProcedure
    .input(inviteCodeByIdSchema)
    .mutation(async ({ input }) => {
      return disableInviteCode(input);
    }),

  reactivate: adminProcedure
    .input(inviteCodeByIdSchema)
    .mutation(async ({ input }) => {
      return reactivateInviteCode(input);
    }),

  updateMaxRedemptions: adminProcedure
    .input(updateMaxRedemptionsSchema)
    .mutation(async ({ input }) => {
      return updateMaxRedemptions(input);
    }),

  walletInfo: adminProcedure.query(async () => {
    try {
      const wallet = inviteWallets[Chain.BASE];
      const token = usdc(Chain.BASE);

      // Get address first to validate wallet is configured
      const address = await wallet.address();

      if (!address) {
        return {
          configured: false,
          error:
            'Invite wallet not configured. Check CDP credentials and INVITE_WALLET_NAME env variable.',
          chain: Chain.BASE,
        };
      }

      // Fetch balances directly using the address we already have
      const client = createPublicClient({
        chain: base,
        transport: http(env.NEXT_PUBLIC_BASE_RPC_URL),
      });
      const [usdcBalanceRaw, ethBalanceRaw] = await Promise.all([
        readContract(client, {
          abi: erc20Abi,
          address: token.address as `0x${string}`,
          args: [address],
          functionName: 'balanceOf',
        }),
        getBalance(client, { address }),
      ]);

      return {
        configured: true,
        address,
        usdcBalance: convertTokenAmount(usdcBalanceRaw),
        ethBalance: parseFloat(formatEther(ethBalanceRaw)),
        chain: Chain.BASE,
      };
    } catch (error) {
      console.error('Failed to get invite wallet info:', error);
      return {
        configured: false,
        error: 'Failed to load invite wallet. Check CDP configuration.',
        chain: Chain.BASE,
      };
    }
  }),
});
