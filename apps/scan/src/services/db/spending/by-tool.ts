import z from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../client';
import {
  toPaginatedResponse,
  paginationClause,
  type PaginatedQueryParams,
} from '@/lib/pagination';

const toolSpendingResultSchema = z.array(
  z.object({
    resourceId: z.string(),
    resourceUrl: z.string(),
    totalToolCalls: z.number(),
    uniqueWallets: z.number(),
    totalMaxAmount: z.string(),
    lastUsedAt: z.date().nullable(),
  })
);

const toolWalletBreakdownResultSchema = z.array(
  z.object({
    resourceId: z.string(),
    resourceUrl: z.string(),
    walletId: z.string(),
    walletName: z.string(),
    toolCalls: z.number(),
    maxAmountPerCall: z.string(),
    totalMaxAmount: z.string(),
    lastUsedAt: z.date().nullable(),
  })
);

export type ToolSpendingSortId =
  | 'resourceUrl'
  | 'totalToolCalls'
  | 'uniqueWallets'
  | 'totalMaxAmount'
  | 'lastUsedAt';

export const getSpendingByTool = async (
  pagination: PaginatedQueryParams,
  sorting?: {
    id: ToolSpendingSortId;
    desc: boolean;
  }
) => {
  const orderByColumn = sorting?.id ?? 'totalMaxAmount';
  const orderDirection = (sorting?.desc ?? true) ? 'DESC' : 'ASC';

  const orderByMap: Record<ToolSpendingSortId, string> = {
    resourceUrl: 'r.resource',
    totalToolCalls: 'COUNT(DISTINCT tc.id)',
    uniqueWallets: 'COUNT(DISTINCT sw.id)',
    totalMaxAmount: 'COALESCE(SUM(a."maxAmountRequired"), 0)',
    lastUsedAt: 'MAX(tc."createdAt")',
  };

  const orderByClause = Prisma.raw(
    `${orderByMap[orderByColumn]} ${orderDirection}`
  );

  // Get total count first
  const countSql = Prisma.sql`
    SELECT COUNT(DISTINCT r.id)::int as "total"
    FROM "Resources" r
    INNER JOIN "ToolCall" tc ON tc."resourceId" = r.id
  `;

  const countResult = await prisma.$queryRaw<Array<{ total: number }>>(
    countSql
  );
  const total_count = countResult[0]?.total ?? 0;

  // Get paginated results
  const sql = Prisma.sql`
    SELECT
      r.id as "resourceId",
      r.resource as "resourceUrl",
      COUNT(DISTINCT tc.id)::int as "totalToolCalls",
      COUNT(DISTINCT sw.id)::int as "uniqueWallets",
      COALESCE(SUM(a."maxAmountRequired"), 0)::text as "totalMaxAmount",
      MAX(tc."createdAt") as "lastUsedAt"
    FROM "Resources" r
    LEFT JOIN "ToolCall" tc ON tc."resourceId" = r.id
    LEFT JOIN "Chat" c ON c.id = tc."chatId"
    LEFT JOIN "User" u ON u.id = c."userId"
    LEFT JOIN "ServerWallet" sw ON sw."userId" = u.id
    LEFT JOIN "Accepts" a ON a."resourceId" = r.id AND a.network = 'base'
    WHERE tc.id IS NOT NULL
    GROUP BY r.id, r.resource
    ORDER BY ${orderByClause}
    ${paginationClause(pagination)}
  `;

  const rawResult = await prisma.$queryRaw<
    Array<{
      resourceId: string;
      resourceUrl: string;
      totalToolCalls: number;
      uniqueWallets: number;
      totalMaxAmount: string;
      lastUsedAt: Date | null;
    }>
  >(sql);

  const items = toolSpendingResultSchema.parse(rawResult);

  return toPaginatedResponse({
    items,
    page: pagination.page,
    page_size: pagination.page_size,
    total_count,
  });
};

export type WalletBreakdownSortId =
  | 'walletName'
  | 'toolCalls'
  | 'maxAmountPerCall'
  | 'totalMaxAmount'
  | 'lastUsedAt';

export const getWalletBreakdownByTool = async (
  resourceId: string,
  sorting?: { id: WalletBreakdownSortId; desc: boolean }
) => {
  const orderByColumn = sorting?.id ?? 'totalMaxAmount';
  const orderDirection = (sorting?.desc ?? true) ? 'DESC' : 'ASC';

  const orderByMap: Record<WalletBreakdownSortId, string> = {
    walletName: 'sw."walletName"',
    toolCalls: 'COUNT(tc.id)',
    maxAmountPerCall: 'MAX(a."maxAmountRequired")',
    totalMaxAmount: 'COALESCE(SUM(a."maxAmountRequired"), 0)',
    lastUsedAt: 'MAX(tc."createdAt")',
  };

  const orderByClause = Prisma.raw(
    `${orderByMap[orderByColumn]} ${orderDirection}`
  );

  const sql = Prisma.sql`
    SELECT 
      r.id as "resourceId",
      r.resource as "resourceUrl",
      sw.id as "walletId",
      sw."walletName" as "walletName",
      COUNT(tc.id)::int as "toolCalls",
      MAX(a."maxAmountRequired")::text as "maxAmountPerCall",
      COALESCE(SUM(a."maxAmountRequired"), 0)::text as "totalMaxAmount",
      MAX(tc."createdAt") as "lastUsedAt"
    FROM "Resources" r
    INNER JOIN "ToolCall" tc ON tc."resourceId" = r.id
    INNER JOIN "Chat" c ON c.id = tc."chatId"
    INNER JOIN "User" u ON u.id = c."userId"
    INNER JOIN "ServerWallet" sw ON sw."userId" = u.id
    LEFT JOIN "Accepts" a ON a."resourceId" = r.id AND a.network = 'base'
    WHERE r.id = ${resourceId}
    GROUP BY r.id, r.resource, sw.id, sw."walletName"
    ORDER BY ${orderByClause}
  `;

  const rawResult = await prisma.$queryRaw<
    Array<{
      resourceId: string;
      resourceUrl: string;
      walletId: string;
      walletName: string;
      toolCalls: number;
      maxAmountPerCall: string;
      totalMaxAmount: string;
      lastUsedAt: Date | null;
    }>
  >(sql);

  return toolWalletBreakdownResultSchema.parse(rawResult);
};
