import z from 'zod';

import { formatUnits } from 'viem';

import { InviteCodeStatus, RedemptionStatus, scanDb } from '@x402scan/scan-db';

import { inviteWallets } from '@/services/cdp/server-wallet/invite';

import { usdc } from '@/lib/tokens/usdc';
import { mixedAddressSchema } from '@/lib/schemas';

import { Chain } from '@/types/chain';
import { dbErr, dbOk, dbResultFromPromise } from '../result';

import { cdpErr } from '@/services/cdp/server-wallet/wallets/lib';

import type { CdpError } from '@/services/cdp/server-wallet/wallets/lib';

export const validateInviteCodeSchema = z.object({
  code: z.string().min(1),
  recipientAddr: mixedAddressSchema.optional(),
});

export const validateInviteCode = async ({
  code,
  recipientAddr,
}: z.infer<typeof validateInviteCodeSchema>) => {
  const result = await dbResultFromPromise(
    scanDb.inviteCode.findUnique({
      where: { code },
    }),
    'Failed to find invite code'
  );

  if (result.isErr()) {
    return dbErr(result.error);
  }

  const inviteCode = result.value;

  if (!inviteCode) {
    return dbErr({ type: 'not_found', message: 'Invalid invite code' });
  }

  if (inviteCode.status !== 'ACTIVE') {
    return dbErr({
      type: 'conflict',
      message: `Invite code is ${inviteCode.status.toLowerCase()}`,
    });
  }

  if (inviteCode.expiresAt && inviteCode.expiresAt < new Date()) {
    return dbErr({ type: 'conflict', message: 'Invite code has expired' });
  }

  if (
    inviteCode.maxRedemptions > 0 &&
    inviteCode.redemptionCount >= inviteCode.maxRedemptions
  ) {
    return dbErr({
      type: 'conflict',
      message: 'Invite code has been fully redeemed',
    });
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
      return dbErr({
        type: 'conflict',
        message: 'You have already redeemed this invite code',
      });
    }
  }

  return dbOk({ message: 'Invite code is valid' });
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
  const transactionResult = await dbResultFromPromise(
    scanDb.$transaction(
      async tx => {
        // Lock and fetch the invite code
        const inviteCode = await tx.inviteCode.findUnique({
          where: { code },
        });

        if (!inviteCode) {
          return dbErr({
            type: 'not_found',
            message: 'Invalid invite code',
          });
        }

        if (inviteCode.status !== InviteCodeStatus.ACTIVE) {
          return dbErr({
            type: 'conflict',
            message: `Invite code is ${inviteCode.status.toLowerCase()}`,
          });
        }

        if (inviteCode.expiresAt && inviteCode.expiresAt < new Date()) {
          // Update status to expired
          await tx.inviteCode.update({
            where: { id: inviteCode.id },
            data: { status: InviteCodeStatus.EXPIRED },
          });
          return dbErr({
            type: 'conflict',
            message: 'Invite code has expired',
          });
        }

        if (
          inviteCode.maxRedemptions > 0 &&
          inviteCode.redemptionCount >= inviteCode.maxRedemptions
        ) {
          return dbErr({
            type: 'conflict',
            message: 'Invite code has been fully redeemed',
          });
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
            return dbErr({
              type: 'conflict',
              message: 'You have already redeemed this invite code',
            });
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
            status: RedemptionStatus.PENDING,
          },
        });

        // Check if code should be marked as exhausted
        if (
          updatedCode.maxRedemptions > 0 &&
          updatedCode.redemptionCount >= updatedCode.maxRedemptions
        ) {
          await tx.inviteCode.update({
            where: { id: inviteCode.id },
            data: { status: InviteCodeStatus.EXHAUSTED },
          });
        }

        return dbOk({ inviteCode, redemption, updatedCode });
      },
      {
        isolationLevel: 'Serializable',
      }
    ),
    'Invite code redemption failed'
  );

  if (transactionResult.isErr()) {
    return dbErr(transactionResult.error);
  }

  // The transaction returned a Result - unwrap it
  const innerResult = transactionResult.value;
  if (innerResult.isErr()) {
    return dbErr(innerResult.error);
  }

  const { inviteCode, redemption } = innerResult.value;

  // Now send the tokens (outside transaction - can't roll back blockchain tx)
  const wallet = inviteWallets[Chain.BASE];
  const token = usdc(Chain.BASE);
  const amountFloat = parseFloat(
    formatUnits(inviteCode.amount, token.decimals)
  );

  const walletAddressResult = await wallet.address();

  if (walletAddressResult.isErr()) {
    return handleRedemptionFailure({
      redemptionId: redemption.id,
      inviteCodeId: inviteCode.id,
      error: walletAddressResult.error,
    });
  }

  const walletBalanceResult = await wallet.getTokenBalance({ token });

  if (walletBalanceResult.isErr()) {
    return handleRedemptionFailure({
      redemptionId: redemption.id,
      inviteCodeId: inviteCode.id,
      error: walletBalanceResult.error,
    });
  }

  console.log(
    `Invite wallet: ${walletAddressResult.value}, balance: ${walletBalanceResult.value} USDC, sending: ${amountFloat} USDC to ${recipientAddr}`
  );

  const sendTokensResult = await wallet.sendTokens({
    token,
    amount: amountFloat,
    address: recipientAddr as `0x${string}`,
  });

  if (sendTokensResult.isErr()) {
    return handleRedemptionFailure({
      redemptionId: redemption.id,
      inviteCodeId: inviteCode.id,
      error: sendTokensResult.error,
    });
  }

  const txHash = sendTokensResult.value;

  // Update redemption as successful
  const updateSuccessResult = await dbResultFromPromise(
    scanDb.inviteRedemption.update({
      where: { id: redemption.id },
      data: {
        status: RedemptionStatus.SUCCESS,
        txHash,
        completedAt: new Date(),
      },
    }),
    'Failed to update redemption status'
  );

  if (updateSuccessResult.isErr()) {
    // Token transfer succeeded but DB update failed - log but still return success
    console.error(
      'Failed to update redemption status after successful transfer:',
      updateSuccessResult.error.message
    );
  }

  return dbOk({
    redemptionId: redemption.id,
    txHash,
    amount: formatUnits(inviteCode.amount, token.decimals),
  });
};

interface HandleRedemptionFailureData {
  redemptionId: string;
  inviteCodeId: string;
  error: CdpError;
}

const handleRedemptionFailure = async ({
  redemptionId,
  inviteCodeId,
  error,
}: HandleRedemptionFailureData) => {
  console.error('Invite code redemption transfer failed:', error.message);

  await dbResultFromPromise(
    scanDb.inviteRedemption.update({
      where: { id: redemptionId },
      data: {
        status: RedemptionStatus.FAILED,
        failureReason: error.message,
        completedAt: new Date(),
      },
    }),
    'Failed to update redemption status'
  );

  await dbResultFromPromise(
    scanDb.inviteCode.update({
      where: { id: inviteCodeId },
      data: { redemptionCount: { decrement: 1 } },
    }),
    'Failed to decrement redemption count'
  ).map(async updatedCode => {
    if (
      updatedCode.status === InviteCodeStatus.EXHAUSTED &&
      (updatedCode.maxRedemptions === 0 ||
        updatedCode.redemptionCount < updatedCode.maxRedemptions)
    ) {
      await scanDb.inviteCode.update({
        where: { id: inviteCodeId },
        data: { status: InviteCodeStatus.ACTIVE },
      });
    }
  });

  return cdpErr(error);
};
