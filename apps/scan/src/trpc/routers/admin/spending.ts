import z from "zod";

import { paginatedQuerySchema } from "@/lib/pagination";
import { getWalletAddressFromName } from "@/services/cdp/server-wallet/admin";
import {
  listAllServerAccounts,
  generateAccountsCsv,
} from "@/services/cdp/server-wallet/list-accounts";
import {
  getSpendingByTool,
  getWalletBreakdownByTool,
} from "@/services/db/spending/by-tool";
import {
  getSpendingByWallet,
  getToolBreakdownByWallet,
} from "@/services/db/spending/by-wallet";
import {
  getToolCallsOverTime,
  toolCallsOverTimeQuerySchema,
} from "@/services/db/spending/tool-calls-over-time";

import { adminProcedure, createTRPCRouter } from "../../trpc";

import type {
  ToolSpendingSortId,
  WalletBreakdownSortId,
} from "@/services/db/spending/by-tool";
import type {
  WalletSpendingSortId,
  ToolBreakdownSortId,
} from "@/services/db/spending/by-wallet";

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
              "walletName",
              "totalToolCalls",
              "uniqueResources",
              "totalMaxAmount",
            ] satisfies WalletSpendingSortId[]),
            desc: z.boolean(),
          })
          .optional(),
      })
    )
    .query(async ({ input }) => {
      return getSpendingByWallet({ sorting: input.sorting }, input.pagination);
    }),

  toolBreakdown: adminProcedure
    .input(
      z.object({
        walletId: z.uuid(),
        sorting: z
          .object({
            id: z.enum([
              "resourceUrl",
              "toolCalls",
              "maxAmountPerCall",
              "totalMaxAmount",
            ] satisfies ToolBreakdownSortId[]),
            desc: z.boolean(),
          })
          .optional(),
      })
    )
    .query(async ({ input }) => {
      return getToolBreakdownByWallet(input.walletId, input.sorting);
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
              "resourceUrl",
              "totalToolCalls",
              "uniqueWallets",
              "totalMaxAmount",
              "lastUsedAt",
            ] satisfies ToolSpendingSortId[]),
            desc: z.boolean(),
          })
          .optional(),
      })
    )
    .query(async ({ input }) => {
      return getSpendingByTool({ sorting: input.sorting }, input.pagination);
    }),

  walletBreakdown: adminProcedure
    .input(
      z.object({
        resourceId: z.uuid(),
        sorting: z
          .object({
            id: z.enum([
              "walletName",
              "toolCalls",
              "maxAmountPerCall",
              "totalMaxAmount",
              "lastUsedAt",
            ] satisfies WalletBreakdownSortId[]),
            desc: z.boolean(),
          })
          .optional(),
      })
    )
    .query(async ({ input }) => {
      return getWalletBreakdownByTool(input.resourceId, input.sorting);
    }),

  getWalletAddress: adminProcedure
    .input(z.object({ walletName: z.string() }))
    .query(async ({ input }) => {
      return getWalletAddressFromName(input.walletName);
    }),

  toolCallsOverTime: adminProcedure
    .input(toolCallsOverTimeQuerySchema)
    .query(async ({ input }) => {
      return getToolCallsOverTime(input);
    }),

  getServerAccountsCsv: adminProcedure.query(async () => {
    const accounts = await listAllServerAccounts();
    return generateAccountsCsv(accounts);
  }),
});
