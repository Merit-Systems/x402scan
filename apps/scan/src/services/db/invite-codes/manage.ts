import { scanDb, type InviteCodeStatus } from '@x402scan/scan-db';

export const updateInviteCodeStatus = async (
  id: string,
  status: InviteCodeStatus
) => {
  return scanDb.inviteCode.update({
    where: { id },
    data: { status },
  });
};

export const disableInviteCode = async (id: string) => {
  return updateInviteCodeStatus(id, 'DISABLED');
};

export const expireInviteCode = async (id: string) => {
  return updateInviteCodeStatus(id, 'EXPIRED');
};

export const reactivateInviteCode = async (id: string) => {
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

  return updateInviteCodeStatus(id, 'ACTIVE');
};

export const updateInviteCodeNote = async (id: string, note: string | null) => {
  return scanDb.inviteCode.update({
    where: { id },
    data: { note },
  });
};

export const updateMaxRedemptions = async (
  id: string,
  maxRedemptions: number
) => {
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
      data: { status: 'ACTIVE' },
    });
  }

  // If code was active but now exhausted, mark it
  if (
    updated.status === 'ACTIVE' &&
    maxRedemptions > 0 &&
    updated.redemptionCount >= maxRedemptions
  ) {
    return scanDb.inviteCode.update({
      where: { id },
      data: { status: 'EXHAUSTED' },
    });
  }

  return updated;
};
