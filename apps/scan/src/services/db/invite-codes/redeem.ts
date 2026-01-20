import { scanDb } from '@x402scan/scan-db';
import { inviteWallets } from '@/services/cdp/server-wallet/invite';
import { usdc } from '@/lib/tokens/usdc';
import { Chain } from '@/types/chain';
import { formatUnits } from 'viem';
import { mixedAddressSchema } from '@/lib/schemas';
import z from 'zod';

export const validateInviteCodeSchema = z.object({
  code: z.string().min(1),
  recipientAddr: mixedAddressSchema.optional(),
});

export const validateInviteCode = async ({
  code,
  recipientAddr,
}: z.infer<typeof validateInviteCodeSchema>) => {
  const inviteCode = await scanDb.inviteCode.findUnique({
    where: { code },
  });

  if (!inviteCode) {
    return { valid: false, error: 'Invalid invite code' };
  }

  if (inviteCode.status !== 'ACTIVE') {
    return {
      valid: false,
      error: `Invite code is ${inviteCode.status.toLowerCase()}`,
    };
  }

  if (inviteCode.expiresAt && inviteCode.expiresAt < new Date()) {
    return { valid: false, error: 'Invite code has expired' };
  }

  if (
    inviteCode.maxRedemptions > 0 &&
    inviteCode.redemptionCount >= inviteCode.maxRedemptions
  ) {
    return { valid: false, error: 'Invite code has been fully redeemed' };
  }

  if (recipientAddr && inviteCode.uniqueRecipients) {
    const existingRedemption = await scanDb.inviteRedemption.findFirst({
      where: {
        inviteCodeId: inviteCode.id,
        recipientAddr: recipientAddr.toLowerCase(),
        status: { in: ['PENDING', 'SUCCESS'] },
      },
    });
    if (existingRedemption) {
      return {
        valid: false,
        error: 'You have already redeemed this invite code',
      };
    }
  }

  return { valid: true };
};

export const redeemInviteCodeSchema = z.object({
  code: z.string().min(1),
  recipientAddr: mixedAddressSchema,
});

export const redeemInviteCode = async ({
  code,
  recipientAddr,
}: z.infer<typeof redeemInviteCodeSchema>) => {
  const normalizedAddr = recipientAddr.toLowerCase();

  // Use a transaction with serializable isolation to prevent race conditions
  // This ensures atomic check-and-increment of redemption count
  try {
    const result = await scanDb.$transaction(
      async tx => {
        // Lock and fetch the invite code
        const inviteCode = await tx.inviteCode.findUnique({
          where: { code },
        });

        if (!inviteCode) {
          return { success: false, error: 'Invalid invite code' } as const;
        }

        if (inviteCode.status !== 'ACTIVE') {
          return {
            success: false,
            error: `Invite code is ${inviteCode.status.toLowerCase()}`,
          } as const;
        }

        if (inviteCode.expiresAt && inviteCode.expiresAt < new Date()) {
          // Update status to expired
          await tx.inviteCode.update({
            where: { id: inviteCode.id },
            data: { status: 'EXPIRED' },
          });
          return { success: false, error: 'Invite code has expired' } as const;
        }

        if (
          inviteCode.maxRedemptions > 0 &&
          inviteCode.redemptionCount >= inviteCode.maxRedemptions
        ) {
          return {
            success: false,
            error: 'Invite code has been fully redeemed',
          } as const;
        }

        // Check unique recipients constraint
        if (inviteCode.uniqueRecipients) {
          const existingRedemption = await tx.inviteRedemption.findFirst({
            where: {
              inviteCodeId: inviteCode.id,
              recipientAddr: normalizedAddr,
              status: { in: ['PENDING', 'SUCCESS'] },
            },
          });
          if (existingRedemption) {
            return {
              success: false,
              error: 'You have already redeemed this invite code',
            } as const;
          }
        }

        // Atomically increment redemption count BEFORE sending tokens
        // This prevents race conditions - if two requests come in simultaneously,
        // only one will succeed in incrementing within the limit
        const updatedCode = await tx.inviteCode.update({
          where: {
            id: inviteCode.id,
            // Additional safety: only update if still within limits
            redemptionCount: {
              lt:
                inviteCode.maxRedemptions > 0
                  ? inviteCode.maxRedemptions
                  : 999999999,
            },
          },
          data: {
            redemptionCount: { increment: 1 },
          },
        });

        // Create the redemption record
        const redemption = await tx.inviteRedemption.create({
          data: {
            inviteCodeId: inviteCode.id,
            recipientAddr: normalizedAddr,
            amount: inviteCode.amount,
            status: 'PENDING',
          },
        });

        // Check if code should be marked as exhausted
        if (
          updatedCode.maxRedemptions > 0 &&
          updatedCode.redemptionCount >= updatedCode.maxRedemptions
        ) {
          await tx.inviteCode.update({
            where: { id: inviteCode.id },
            data: { status: 'EXHAUSTED' },
          });
        }

        return {
          success: true,
          inviteCode,
          redemption,
          updatedCode,
        } as const;
      },
      {
        isolationLevel: 'Serializable',
      }
    );

    if (!result.success) {
      return result;
    }

    const { inviteCode, redemption } = result;

    // Now send the tokens (outside transaction - can't roll back blockchain tx)
    try {
      const wallet = inviteWallets[Chain.BASE];
      const token = usdc(Chain.BASE);
      const amountFloat = parseFloat(
        formatUnits(inviteCode.amount, token.decimals)
      );

      const walletAddress = await wallet.address();
      const walletBalance = await wallet.getTokenBalance({ token });
      console.log(
        `Invite wallet: ${walletAddress}, balance: ${walletBalance} USDC, sending: ${amountFloat} USDC to ${recipientAddr}`
      );

      const txHash = await wallet.sendTokens({
        token,
        amount: amountFloat,
        address: recipientAddr as `0x${string}`,
      });

      // Update redemption as successful
      await scanDb.inviteRedemption.update({
        where: { id: redemption.id },
        data: {
          status: 'SUCCESS',
          txHash,
          completedAt: new Date(),
        },
      });

      return {
        success: true,
        redemptionId: redemption.id,
        txHash,
        amount: formatUnits(inviteCode.amount, token.decimals),
      };
    } catch (error) {
      // Log the actual error for debugging
      console.error('Invite code redemption transfer failed:', error);

      // Update redemption as failed
      await scanDb.inviteRedemption.update({
        where: { id: redemption.id },
        data: {
          status: 'FAILED',
          failureReason:
            error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      });

      // Decrement redemption count since transfer failed
      const updatedCode = await scanDb.inviteCode.update({
        where: { id: inviteCode.id },
        data: {
          redemptionCount: { decrement: 1 },
        },
      });

      // If code was marked exhausted but now has room, reactivate it
      if (
        updatedCode.status === 'EXHAUSTED' &&
        (updatedCode.maxRedemptions === 0 ||
          updatedCode.redemptionCount < updatedCode.maxRedemptions)
      ) {
        await scanDb.inviteCode.update({
          where: { id: inviteCode.id },
          data: { status: 'ACTIVE' },
        });
      }

      return {
        success: false,
        error: 'Unable to process redemption. Please try again later.',
        redemptionId: redemption.id,
      };
    }
  } catch (error) {
    console.error('Invite code redemption transaction failed:', error);

    // Check if this is a Prisma error from the conditional update failing
    // (i.e., redemptionCount was no longer < maxRedemptions due to race condition)
    const isPrismaNotFound =
      error instanceof Error &&
      error.name === 'PrismaClientKnownRequestError' &&
      'code' in error &&
      error.code === 'P2025';

    if (isPrismaNotFound) {
      return {
        success: false,
        error: 'Invite code has been fully redeemed',
      };
    }

    return {
      success: false,
      error: 'Unable to process redemption. Please try again later.',
    };
  }
};
