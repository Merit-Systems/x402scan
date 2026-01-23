import z from 'zod';

import { scanDb } from '@x402scan/scan-db';

import type { inviteCodeByIdSchema } from './schemas';

export const getRedemptionsByWallet = async (walletAddress: string) => {
  return scanDb.inviteRedemption.findMany({
    where: {
      recipientAddr: walletAddress.toLowerCase(),
      status: 'SUCCESS',
    },
    include: {
      inviteCode: {
        select: {
          code: true,
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const mcpUserSortIdSchema = z.enum([
  'totalSpent',
  'totalAmount',
  'transactionCount',
  'lastRedemption',
]);

export type McpUserSortId = z.infer<typeof mcpUserSortIdSchema>;

export const listMcpUsersSchema = z
  .object({
    search: z.string().optional(),
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0),
    sortBy: mcpUserSortIdSchema.optional(),
    sortDesc: z.boolean().optional(),
  })
  .optional();

export const listMcpUsers = async (
  options: z.infer<typeof listMcpUsersSchema>
) => {
  const { search, limit = 50, offset = 0, sortBy, sortDesc = true } =
    options ?? {};

  // Determine orderBy based on sortBy param (only for DB-level sortable fields)
  const getOrderBy = () => {
    const direction = sortDesc ? 'desc' : 'asc';
    switch (sortBy) {
      case 'totalAmount':
        return { _sum: { amount: direction as 'asc' | 'desc' } };
      case 'lastRedemption':
      default:
        return { _max: { createdAt: direction as 'asc' | 'desc' } };
    }
  };

  // Get aggregated stats first
  const stats = await scanDb.inviteRedemption.groupBy({
    by: ['recipientAddr'],
    where: {
      status: 'SUCCESS',
      ...(search && {
        recipientAddr: { contains: search, mode: 'insensitive' },
      }),
    },
    _count: { id: true },
    _sum: { amount: true },
    _min: { createdAt: true },
    _max: { createdAt: true },
    orderBy: getOrderBy(),
    take: limit,
    skip: offset,
  });

  // Get the invite codes for these wallets
  const walletAddresses = stats.map(s => s.recipientAddr);
  const redemptions = await scanDb.inviteRedemption.findMany({
    where: {
      recipientAddr: { in: walletAddresses },
      status: 'SUCCESS',
    },
    select: {
      recipientAddr: true,
      inviteCode: {
        select: {
          code: true,
        },
      },
    },
    distinct: ['recipientAddr', 'inviteCodeId'],
  });

  // Group codes by wallet
  const codesByWallet = new Map<string, string[]>();
  for (const r of redemptions) {
    const codes = codesByWallet.get(r.recipientAddr) ?? [];
    if (!codes.includes(r.inviteCode.code)) {
      codes.push(r.inviteCode.code);
    }
    codesByWallet.set(r.recipientAddr, codes);
  }

  return stats.map(r => ({
    recipientAddr: r.recipientAddr,
    totalRedemptions: r._count.id,
    totalAmount: r._sum.amount ?? BigInt(0),
    firstRedemption: r._min.createdAt!,
    lastRedemption: r._max.createdAt!,
    inviteCodes: codesByWallet.get(r.recipientAddr) ?? [],
  }));
};

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
    search: z.string().optional(),
    limit: z.number().int().min(1).max(100).default(100),
    offset: z.number().int().min(0).default(0),
  })
  .optional();

export const listInviteCodes = async (
  options: z.infer<typeof listInviteCodesSchema>
) => {
  const { status, search, limit = 100, offset = 0 } = options ?? {};

  return scanDb.inviteCode.findMany({
    where: {
      ...(status && { status }),
      ...(search && {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { createdBy: { name: { contains: search, mode: 'insensitive' } } },
          { createdBy: { email: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    },
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
          id: true,
          recipientAddr: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' as const },
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
