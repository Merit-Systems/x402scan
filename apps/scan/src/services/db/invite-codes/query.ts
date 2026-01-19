import { scanDb } from '@x402scan/scan-db';

import type { InviteCodeStatus } from '@x402scan/scan-db';

export const getInviteCodeByCode = async (code: string) => {
  return scanDb.inviteCode.findUnique({
    where: { code },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      redemptions: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });
};

export const getInviteCodeById = async (id: string) => {
  return scanDb.inviteCode.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      redemptions: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });
};

export interface ListInviteCodesOptions {
  status?: InviteCodeStatus;
  limit?: number;
  offset?: number;
}

export const listInviteCodes = async (options: ListInviteCodesOptions = {}) => {
  const { status, limit = 100, offset = 0 } = options;

  return scanDb.inviteCode.findMany({
    where: status ? { status } : undefined,
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: { redemptions: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });
};

export const getRedemptionsByCode = async (code: string) => {
  const inviteCode = await scanDb.inviteCode.findUnique({
    where: { code },
    include: {
      redemptions: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return inviteCode?.redemptions ?? [];
};

export const hasAddressRedeemedCode = async (
  inviteCodeId: string,
  recipientAddr: string
) => {
  const redemption = await scanDb.inviteRedemption.findFirst({
    where: {
      inviteCodeId,
      recipientAddr: recipientAddr.toLowerCase(),
      status: 'SUCCESS',
    },
  });

  return !!redemption;
};
