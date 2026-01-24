import z from 'zod';

import { scanDb } from '@x402scan/scan-db';

import type { inviteCodeByIdSchema } from './schemas';
import type { Prisma } from '@x402scan/scan-db';

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

const statusEnum = z.enum(['ACTIVE', 'EXHAUSTED', 'EXPIRED', 'DISABLED']);

export const listInviteCodesSchema = z
  .object({
    status: statusEnum.optional(),
    search: z.string().optional(),
    orderBy: z.enum(['createdAt', 'status']).optional().default('createdAt'),
    orderDir: z.enum(['asc', 'desc']).optional().default('desc'),
    limit: z.number().int().min(1).max(100).default(100),
    offset: z.number().int().min(0).default(0),
  })
  .optional();

export const listInviteCodes = async (
  options: z.infer<typeof listInviteCodesSchema>
) => {
  const {
    status,
    search,
    orderBy = 'createdAt',
    orderDir = 'desc',
    limit = 100,
    offset = 0,
  } = options ?? {};

  const where: Prisma.InviteCodeWhereInput = {};

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { note: { contains: search, mode: 'insensitive' } },
    ];
  }

  const orderByClause: Prisma.InviteCodeOrderByWithRelationInput[] =
    orderBy === 'status'
      ? [{ status: orderDir }, { createdAt: 'desc' }]
      : [{ createdAt: orderDir }];

  return scanDb.inviteCode.findMany({
    where,
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      redemptions: {
        select: {
          recipientAddr: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: { redemptions: true },
      },
    },
    orderBy: orderByClause,
    take: limit,
    skip: offset,
  });
};
