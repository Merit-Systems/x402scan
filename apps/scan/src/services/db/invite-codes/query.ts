import z from 'zod';

import { scanDb } from '@x402scan/scan-db';

import type { inviteCodeByIdSchema } from './schemas';

export const getInviteCodeById = async ({
  id,
}: z.infer<typeof inviteCodeByIdSchema>) => {
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

export const listInviteCodesSchema = z
  .object({
    status: z.enum(['ACTIVE', 'EXHAUSTED', 'EXPIRED', 'DISABLED']).optional(),
    limit: z.number().int().min(1).max(100).default(100),
    offset: z.number().int().min(0).default(0),
  })
  .optional();

export const listInviteCodes = async (
  options: z.infer<typeof listInviteCodesSchema>
) => {
  const { status, limit = 100, offset = 0 } = options ?? {};

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
