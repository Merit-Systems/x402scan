import { scanDb } from '@x402scan/scan-db';
import { getInviteCodeByCode, hasAddressRedeemedCode } from './query';
import { inviteWallets } from '@/services/cdp/server-wallet/invite';
import { usdc } from '@/lib/tokens/usdc';
import { Chain } from '@/types/chain';
import { formatUnits } from 'viem';

export interface RedeemInviteCodeInput {
  code: string;
  recipientAddr: string;
}

export interface RedeemInviteCodeResult {
  success: boolean;
  error?: string;
  redemptionId?: string;
  txHash?: string;
  amount?: string;
}

export const validateInviteCode = async (
  code: string,
  recipientAddr?: string
): Promise<{ valid: boolean; error?: string }> => {
  const inviteCode = await getInviteCodeByCode(code);

  if (!inviteCode) {
    return { valid: false, error: 'Invalid invite code' };
  }

  if (inviteCode.status !== 'ACTIVE') {
    return { valid: false, error: `Invite code is ${inviteCode.status.toLowerCase()}` };
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
    const alreadyRedeemed = await hasAddressRedeemedCode(
      inviteCode.id,
      recipientAddr
    );
    if (alreadyRedeemed) {
      return { valid: false, error: 'You have already redeemed this invite code' };
    }
  }

  return { valid: true };
};

export const redeemInviteCode = async ({
  code,
  recipientAddr,
}: RedeemInviteCodeInput): Promise<RedeemInviteCodeResult> => {
  const normalizedAddr = recipientAddr.toLowerCase();

  // Validate the code
  const validation = await validateInviteCode(code, normalizedAddr);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const inviteCode = await getInviteCodeByCode(code);
  if (!inviteCode) {
    return { success: false, error: 'Invalid invite code' };
  }

  // Create a pending redemption record
  const redemption = await scanDb.inviteRedemption.create({
    data: {
      inviteCodeId: inviteCode.id,
      recipientAddr: normalizedAddr,
      amount: inviteCode.amount,
      status: 'PENDING',
    },
  });

  try {
    // Get the invite wallet and send the tokens
    const wallet = inviteWallets[Chain.BASE];
    const token = usdc(Chain.BASE);
    const amountFloat = parseFloat(formatUnits(inviteCode.amount, token.decimals));

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

    // Increment redemption count and potentially update status
    const updatedCode = await scanDb.inviteCode.update({
      where: { id: inviteCode.id },
      data: {
        redemptionCount: { increment: 1 },
      },
    });

    // Check if code should be exhausted
    if (
      updatedCode.maxRedemptions > 0 &&
      updatedCode.redemptionCount >= updatedCode.maxRedemptions
    ) {
      await scanDb.inviteCode.update({
        where: { id: inviteCode.id },
        data: { status: 'EXHAUSTED' },
      });
    }

    return {
      success: true,
      redemptionId: redemption.id,
      txHash,
      amount: formatUnits(inviteCode.amount, token.decimals),
    };
  } catch (error) {
    // Log the actual error for debugging
    console.error('Invite code redemption failed:', error);

    // Update redemption as failed
    await scanDb.inviteRedemption.update({
      where: { id: redemption.id },
      data: {
        status: 'FAILED',
        failureReason: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      },
    });

    return {
      success: false,
      error: 'Unable to process redemption. Please try again later.',
      redemptionId: redemption.id,
    };
  }
};
