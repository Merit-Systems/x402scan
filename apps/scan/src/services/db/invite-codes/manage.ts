import z from 'zod';

import { scanDb, InviteCodeStatus } from '@x402scan/scan-db';

import { inviteCodeByIdSchema } from './schemas';

import type { InviteCodeById } from './schemas';

const updateInviteCodeStatus = async (id: string, status: InviteCodeStatus) => {
  return scanDb.inviteCode.update({
    where: { id },
    data: { status },
  });
};

export const disableInviteCode = async ({ id }: InviteCodeById) => {
  return updateInviteCodeStatus(id, InviteCodeStatus.DISABLED);
};

export const reactivateInviteCode = async ({ id }: InviteCodeById) => {
  const inviteCode = await scanDb.inviteCode.findUnique({
    where: { id },
  });

  if (!inviteCode) {
    throw new Error('Invite code not found');
  }

  // Check if the code can be reactivated
  if (
    inviteCode.maxRedemptions > 0 &&
    inviteCode.redemptionCount >= inviteCode.maxRedemptions
  ) {
    throw new Error('Cannot reactivate exhausted invite code');
  }

  return updateInviteCodeStatus(id, InviteCodeStatus.ACTIVE);
};

export const updateMaxRedemptionsSchema = inviteCodeByIdSchema.extend({
  maxRedemptions: z.number().int().min(0),
});

export const updateMaxRedemptions = async ({
  id,
  maxRedemptions,
}: z.infer<typeof updateMaxRedemptionsSchema>) => {
  const inviteCode = await scanDb.inviteCode.findUnique({
    where: { id },
  });

  if (!inviteCode) {
    throw new Error('Invite code not found');
  }

  const updated = await scanDb.inviteCode.update({
    where: { id },
    data: { maxRedemptions },
  });

  // If code was exhausted but now has room, reactivate it
  if (
    updated.status === 'EXHAUSTED' &&
    (maxRedemptions === 0 || updated.redemptionCount < maxRedemptions)
  ) {
    return scanDb.inviteCode.update({
      where: { id },
      data: { status: InviteCodeStatus.ACTIVE },
    });
  }

  // If code was active but now exhausted, mark it
  if (
    updated.status === InviteCodeStatus.ACTIVE &&
    maxRedemptions > 0 &&
    updated.redemptionCount >= maxRedemptions
  ) {
    return scanDb.inviteCode.update({
      where: { id },
      data: { status: InviteCodeStatus.EXHAUSTED },
    });
  }

  return updated;
};
