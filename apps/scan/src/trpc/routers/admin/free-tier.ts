import { TRPCError } from "@trpc/server";

import { freeTierWallets } from "@/services/cdp/server-wallet/free-tier";
import { Chain } from "@/types/chain";

import { createTRPCRouter, adminProcedure } from "../../trpc";

export const adminFreeTierRouter = createTRPCRouter({
  address: adminProcedure.query(async () => {
    const result = await freeTierWallets[Chain.BASE].address();
    if (result.isErr()) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: result.error.message,
      });
    }
    return result.value;
  }),
});
