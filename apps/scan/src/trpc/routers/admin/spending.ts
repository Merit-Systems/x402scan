import z from 'zod';

import { adminProcedure, createTRPCRouter } from '../../trpc';

import {
  getSpendingByWallet,
  getToolBreakdownByWallet,
  type WalletSpendingSortId,
  type ToolBreakdownSortId,
} from '@/services/db/spending/by-wallet';

import {
  getSpendingByTool,
  getWalletBreakdownByTool,
  type ToolSpendingSortId,
  type WalletBreakdownSortId,
} from '@/services/db/spending/by-tool';

import {
  getToolCallsOverTime,
  toolCallsOverTimeQuerySchema,
} from '@/services/db/spending/tool-calls-over-time';

import { getWalletAddressFromName } from '@/services/cdp/server-wallet/admin';
import {
  listAllServerAccounts,
  generateAccountsCsv,
} from '@/services/cdp/server-wallet/list-accounts';
import { paginatedQuerySchema } from '@/lib/pagination';

export const adminSpendingRouter = createTRPCRouter({
  byWallet: adminProcedure
    .input(
      z.object({
        pagination: paginatedQuerySchema.default({
          page: 0,
          page_size: 50,
        }),
        sorting: z
          .object({
            id: z.enum([
              'walletName',
              'totalToolCalls',
              'uniqueResources',
              'totalMaxAmount',
            ] satisfies WalletSpendingSortId[]),
            desc: z.boolean(),
          })
          .optional(),
      })
    )
    .query(async ({ input }) => {
      return await getSpendingByWallet(input.pagination, input.sorting);
    }),

  toolBreakdown: adminProcedure
    .input(
      z.object({
        walletId: z.string().uuid(),
        sorting: z
          .object({
            id: z.enum([
              'resourceUrl',
              'toolCalls',
              'maxAmountPerCall',
              'totalMaxAmount',
            ] satisfies ToolBreakdownSortId[]),
            desc: z.boolean(),
          })
          .optional(),
      })
    )
    .query(async ({ input }) => {
      return await getToolBreakdownByWallet(input.walletId, input.sorting);
    }),

  byTool: adminProcedure
    .input(
      z.object({
        pagination: paginatedQuerySchema.default({
          page: 0,
          page_size: 50,
        }),
        sorting: z
          .object({
            id: z.enum([
              'resourceUrl',
              'totalToolCalls',
              'uniqueWallets',
              'totalMaxAmount',
              'lastUsedAt',
            ] satisfies ToolSpendingSortId[]),
            desc: z.boolean(),
          })
          .optional(),
      })
    )
    .query(async ({ input }) => {
      return await getSpendingByTool(input.pagination, input.sorting);
    }),

  walletBreakdown: adminProcedure
    .input(
      z.object({
        resourceId: z.string().uuid(),
        sorting: z
          .object({
            id: z.enum([
              'walletName',
              'toolCalls',
              'maxAmountPerCall',
              'totalMaxAmount',
              'lastUsedAt',
            ] satisfies WalletBreakdownSortId[]),
            desc: z.boolean(),
          })
          .optional(),
      })
    )
    .query(async ({ input }) => {
      return await getWalletBreakdownByTool(input.resourceId, input.sorting);
    }),

  getWalletAddress: adminProcedure
    .input(z.object({ walletName: z.string() }))
    .query(async ({ input }) => {
      return await getWalletAddressFromName(input.walletName);
    }),

  toolCallsOverTime: adminProcedure
    .input(toolCallsOverTimeQuerySchema)
    .query(async ({ input }) => {
      return await getToolCallsOverTime(input);
    }),

  getServerAccountsCsv: adminProcedure.query(async () => {
    const accounts = await listAllServerAccounts();
    return generateAccountsCsv(accounts);
  }),
});
