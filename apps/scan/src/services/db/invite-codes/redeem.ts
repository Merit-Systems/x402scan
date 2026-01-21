import z from 'zod';

import { formatUnits } from 'viem';

import type { Result } from 'neverthrow';
import { ResultAsync } from 'neverthrow';

import {
  InviteCodeStatus,
  Prisma,
  RedemptionStatus,
  scanDb,
} from '@x402scan/scan-db';

import { inviteWallets } from '@/services/cdp/server-wallet/invite';

import { usdc } from '@/lib/tokens/usdc';
import { mixedAddressSchema } from '@/lib/schemas';

import { Chain } from '@/types/chain';
import { dbErr, dbOk } from '../lib';

import type { DatabaseError } from '../lib';

export const validateInviteCodeSchema = z.object({
  code: z.string().min(1),
  recipientAddr: mixedAddressSchema.optional(),
});

export const validateInviteCode = async ({
  code,
  recipientAddr,
}: z.infer<typeof validateInviteCodeSchema>) => {
  const result = await ResultAsync.fromPromise(
    scanDb.inviteCode.findUnique({
      where: { code },
    }),
    (error): DatabaseError => ({
      type: 'internal',
      message:
        error instanceof Error ? error.message : 'Failed to find invite code',
    })
  );

  if (result.isErr()) {
    return result;
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

  return dbOk('Invite code is valid');
};

export const redeemInviteCodeSchema = z.object({
  code: z.string().min(1),
  recipientAddr: mixedAddressSchema,
});

interface RedeemInviteCodeData {
  redemptionId: string;
  txHash: string;
  amount: string;
}

export const redeemInviteCode = async ({
  code,
  recipientAddr,
}: z.infer<typeof redeemInviteCodeSchema>): Promise<
  Result<RedeemInviteCodeData, DatabaseError>
> => {
  const normalizedAddr = recipientAddr.toLowerCase();

  // Use a transaction with serializable isolation to prevent race conditions
  // This ensures atomic check-and-increment of redemption count
  const transactionResult = await ResultAsync.fromPromise(
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
    (error): DatabaseError => {
      console.error('Invite code redemption transaction failed:', error);

      // Check if this is a Prisma error from the conditional update failing
      // (i.e., redemptionCount was no longer < maxRedemptions due to race condition)
      const isPrismaNotFound =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025';

      if (isPrismaNotFound) {
        return {
          type: 'conflict',
          message: 'Invite code has been fully redeemed',
        };
      }

      return {
        type: 'internal',
        message: 'Unable to process redemption. Please try again later.',
      };
    }
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

  const walletAddressResult = await ResultAsync.fromPromise(
    wallet.address(),
    (e): DatabaseError => ({
      type: 'internal',
      message: e instanceof Error ? e.message : 'Failed to get wallet address',
    })
  );

  if (walletAddressResult.isErr()) {
    console.error(
      'Invite code redemption transfer failed:',
      walletAddressResult.error.message
    );
    await ResultAsync.fromPromise(
      scanDb.inviteRedemption.update({
        where: { id: redemption.id },
        data: {
          status: RedemptionStatus.FAILED,
          failureReason: walletAddressResult.error.message,
          completedAt: new Date(),
        },
      }),
      () => null
    );
    await ResultAsync.fromPromise(
      scanDb.inviteCode.update({
        where: { id: inviteCode.id },
        data: { redemptionCount: { decrement: 1 } },
      }),
      () => null
    ).map(async updatedCode => {
      if (
        updatedCode.status === InviteCodeStatus.EXHAUSTED &&
        (updatedCode.maxRedemptions === 0 ||
          updatedCode.redemptionCount < updatedCode.maxRedemptions)
      ) {
        await scanDb.inviteCode.update({
          where: { id: inviteCode.id },
          data: { status: InviteCodeStatus.ACTIVE },
        });
      }
    });
    return dbErr({
      type: 'internal',
      message: 'Unable to process redemption. Please try again later.',
    });
  }

  const walletBalanceResult = await ResultAsync.fromPromise(
    wallet.getTokenBalance({ token }),
    (e): DatabaseError => ({
      type: 'internal',
      message: e instanceof Error ? e.message : 'Failed to get wallet balance',
    })
  );

  if (walletBalanceResult.isErr()) {
    console.error(
      'Invite code redemption transfer failed:',
      walletBalanceResult.error.message
    );
    await ResultAsync.fromPromise(
      scanDb.inviteRedemption.update({
        where: { id: redemption.id },
        data: {
          status: RedemptionStatus.FAILED,
          failureReason: walletBalanceResult.error.message,
          completedAt: new Date(),
        },
      }),
      () => null
    );
    await ResultAsync.fromPromise(
      scanDb.inviteCode.update({
        where: { id: inviteCode.id },
        data: { redemptionCount: { decrement: 1 } },
      }),
      () => null
    ).map(async updatedCode => {
      if (
        updatedCode.status === InviteCodeStatus.EXHAUSTED &&
        (updatedCode.maxRedemptions === 0 ||
          updatedCode.redemptionCount < updatedCode.maxRedemptions)
      ) {
        await scanDb.inviteCode.update({
          where: { id: inviteCode.id },
          data: { status: InviteCodeStatus.ACTIVE },
        });
      }
    });
    return dbErr({
      type: 'internal',
      message: 'Unable to process redemption. Please try again later.',
    });
  }

  console.log(
    `Invite wallet: ${walletAddressResult.value}, balance: ${walletBalanceResult.value} USDC, sending: ${amountFloat} USDC to ${recipientAddr}`
  );

  const sendTokensResult = await ResultAsync.fromPromise(
    wallet.sendTokens({
      token,
      amount: amountFloat,
      address: recipientAddr as `0x${string}`,
    }),
    (e): DatabaseError => ({
      type: 'internal',
      message: e instanceof Error ? e.message : 'Failed to send tokens',
    })
  );

  if (sendTokensResult.isErr()) {
    console.error(
      'Invite code redemption transfer failed:',
      sendTokensResult.error.message
    );
    await ResultAsync.fromPromise(
      scanDb.inviteRedemption.update({
        where: { id: redemption.id },
        data: {
          status: RedemptionStatus.FAILED,
          failureReason: sendTokensResult.error.message,
          completedAt: new Date(),
        },
      }),
      () => null
    );
    await ResultAsync.fromPromise(
      scanDb.inviteCode.update({
        where: { id: inviteCode.id },
        data: { redemptionCount: { decrement: 1 } },
      }),
      () => null
    ).map(async updatedCode => {
      if (
        updatedCode.status === InviteCodeStatus.EXHAUSTED &&
        (updatedCode.maxRedemptions === 0 ||
          updatedCode.redemptionCount < updatedCode.maxRedemptions)
      ) {
        await scanDb.inviteCode.update({
          where: { id: inviteCode.id },
          data: { status: InviteCodeStatus.ACTIVE },
        });
      }
    });
    return dbErr({
      type: 'internal',
      message: 'Unable to process redemption. Please try again later.',
    });
  }

  const txHash = sendTokensResult.value;

  // Update redemption as successful
  const updateSuccessResult = await ResultAsync.fromPromise(
    scanDb.inviteRedemption.update({
      where: { id: redemption.id },
      data: {
        status: RedemptionStatus.SUCCESS,
        txHash,
        completedAt: new Date(),
      },
    }),
    (e): DatabaseError => ({
      type: 'internal',
      message:
        e instanceof Error ? e.message : 'Failed to update redemption status',
    })
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
