import z from 'zod';
import { createTRPCRouter, adminProcedure } from '../../trpc';
import {
  createInviteCode,
  listInviteCodes,
  getInviteCodeById,
  disableInviteCode,
  reactivateInviteCode,
} from '@/services/db/invite-codes';
import { inviteWallets } from '@/services/cdp/server-wallet/invite';
import { usdc } from '@/lib/tokens/usdc';
import { Chain } from '@/types/chain';
import { getBalance, readContract } from 'wagmi/actions';
import { createWagmiConfig } from '@/app/_contexts/wagmi/config';
import { erc20Abi, formatEther, parseUnits } from 'viem';
import { convertTokenAmount } from '@/lib/token';

export const adminInviteCodesRouter = createTRPCRouter({
  list: adminProcedure
    .input(
      z
        .object({
          status: z
            .enum(['ACTIVE', 'EXHAUSTED', 'EXPIRED', 'DISABLED'])
            .optional(),
          limit: z.number().int().min(1).max(100).default(100),
          offset: z.number().int().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return listInviteCodes(input);
    }),

  getById: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      return getInviteCodeById(input.id);
    }),

  create: adminProcedure
    .input(
      z.object({
        code: z.string().min(1).max(50).optional(),
        amount: z.string(), // Amount in USDC (string to preserve precision)
        maxRedemptions: z.number().int().min(0).default(1),
        uniqueRecipients: z.boolean().default(false),
        expiresAt: z.string().datetime().optional(),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Convert USDC amount to smallest unit (6 decimals)
      const amountInSmallestUnit = parseUnits(input.amount, 6);

      return createInviteCode({
        code: input.code,
        amount: amountInSmallestUnit,
        maxRedemptions: input.maxRedemptions,
        uniqueRecipients: input.uniqueRecipients,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        note: input.note,
        createdById: ctx.session.user.id,
      });
    }),

  disable: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return disableInviteCode(input.id);
    }),

  reactivate: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return reactivateInviteCode(input.id);
    }),

  updateMaxRedemptions: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        maxRedemptions: z.number().int().min(0),
      })
    )
    .mutation(async ({ input }) => {
      const { updateMaxRedemptions } =
        await import('@/services/db/invite-codes/manage');
      return updateMaxRedemptions(input.id, input.maxRedemptions);
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
      const wagmiConfig = createWagmiConfig();
      const [usdcBalanceRaw, ethBalanceRaw] = await Promise.all([
        readContract(wagmiConfig, {
          abi: erc20Abi,
          address: token.address as `0x${string}`,
          args: [address],
          functionName: 'balanceOf',
        }),
        getBalance(wagmiConfig, { address }),
      ]);

      return {
        configured: true,
        address,
        usdcBalance: convertTokenAmount(usdcBalanceRaw),
        ethBalance: parseFloat(formatEther(ethBalanceRaw.value)),
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
