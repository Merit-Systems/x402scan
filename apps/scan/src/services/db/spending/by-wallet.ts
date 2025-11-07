import z from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../client';

const walletSpendingResultSchema = z.array(
  z.object({
    walletId: z.string(),
    walletName: z.string(),
    totalToolCalls: z.number(),
    uniqueResources: z.number(),
    totalMaxAmount: z.string(),
  })
);

const walletToolBreakdownResultSchema = z.array(
  z.object({
    walletId: z.string(),
    walletName: z.string(),
    resourceId: z.string(),
    resourceUrl: z.string(),
    toolCalls: z.number(),
    maxAmountPerCall: z.string(),
    totalMaxAmount: z.string(),
  })
);

export type WalletSpendingSortId =
  | 'walletName'
  | 'totalToolCalls'
  | 'uniqueResources'
  | 'totalMaxAmount';

export const getSpendingByWallet = async (sorting?: {
  id: WalletSpendingSortId;
  desc: boolean;
}) => {
  const orderByColumn = sorting?.id ?? 'totalMaxAmount';
  const orderDirection = (sorting?.desc ?? true) ? 'DESC' : 'ASC';

  const orderByMap: Record<WalletSpendingSortId, string> = {
    walletName: 'sw."walletName"',
    totalToolCalls: 'COUNT(DISTINCT tc.id)',
    uniqueResources: 'COUNT(DISTINCT tc."resourceId")',
    totalMaxAmount: 'COALESCE(SUM(a."maxAmountRequired"), 0)',
  };

  const orderByClause = Prisma.raw(
    `${orderByMap[orderByColumn]} ${orderDirection}`
  );

  const sql = Prisma.sql`
    SELECT 
      sw.id as "walletId",
      sw."walletName" as "walletName",
      COUNT(DISTINCT tc.id)::int as "totalToolCalls",
      COUNT(DISTINCT tc."resourceId")::int as "uniqueResources",
      COALESCE(SUM(a."maxAmountRequired"), 0)::text as "totalMaxAmount"
    FROM "ServerWallet" sw
    INNER JOIN "User" u ON sw."userId" = u.id
    LEFT JOIN "Chat" c ON c."userId" = u.id
    LEFT JOIN "ToolCall" tc ON tc."chatId" = c.id
    LEFT JOIN "Resources" r ON r.id = tc."resourceId"
    LEFT JOIN "Accepts" a ON a."resourceId" = r.id AND a.network = 'base'
    GROUP BY sw.id, sw."walletName"
    ORDER BY ${orderByClause}
  `;

  const rawResult = await prisma.$queryRaw<
    Array<{
      walletId: string;
      walletName: string;
      totalToolCalls: number;
      uniqueResources: number;
      totalMaxAmount: string;
    }>
  >(sql);

  return walletSpendingResultSchema.parse(rawResult);
};

export type ToolBreakdownSortId =
  | 'resourceUrl'
  | 'toolCalls'
  | 'maxAmountPerCall'
  | 'totalMaxAmount';

export const getToolBreakdownByWallet = async (
  walletId: string,
  sorting?: { id: ToolBreakdownSortId; desc: boolean }
) => {
  const orderByColumn = sorting?.id ?? 'totalMaxAmount';
  const orderDirection = (sorting?.desc ?? true) ? 'DESC' : 'ASC';

  const orderByMap: Record<ToolBreakdownSortId, string> = {
    resourceUrl: 'r.resource',
    toolCalls: 'COUNT(tc.id)',
    maxAmountPerCall: 'MAX(a."maxAmountRequired")',
    totalMaxAmount: 'COALESCE(SUM(a."maxAmountRequired"), 0)',
  };

  const orderByClause = Prisma.raw(
    `${orderByMap[orderByColumn]} ${orderDirection}`
  );

  const sql = Prisma.sql`
    SELECT 
      sw.id as "walletId",
      sw."walletName" as "walletName",
      r.id as "resourceId",
      r.resource as "resourceUrl",
      COUNT(tc.id)::int as "toolCalls",
      MAX(a."maxAmountRequired")::text as "maxAmountPerCall",
      COALESCE(SUM(a."maxAmountRequired"), 0)::text as "totalMaxAmount"
    FROM "ServerWallet" sw
    INNER JOIN "User" u ON sw."userId" = u.id
    INNER JOIN "Chat" c ON c."userId" = u.id
    INNER JOIN "ToolCall" tc ON tc."chatId" = c.id
    INNER JOIN "Resources" r ON r.id = tc."resourceId"
    LEFT JOIN "Accepts" a ON a."resourceId" = r.id AND a.network = 'base'
    WHERE sw.id = ${walletId}
    GROUP BY sw.id, sw."walletName", r.id, r.resource
    ORDER BY ${orderByClause}
  `;

  const rawResult = await prisma.$queryRaw<
    Array<{
      walletId: string;
      walletName: string;
      resourceId: string;
      resourceUrl: string;
      toolCalls: number;
      maxAmountPerCall: string;
      totalMaxAmount: string;
    }>
  >(sql);

  return walletToolBreakdownResultSchema.parse(rawResult);
};
