import {
  getSolanaTokenBalance,
  getSolanaTokenBalanceSchema,
} from "@/services/solana/balance";

import { createTRPCRouter, publicProcedure } from "../../trpc";

export const solanaRouter = createTRPCRouter({
  balance: publicProcedure
    .input(getSolanaTokenBalanceSchema)
    .query(async ({ input }) => {
      return getSolanaTokenBalance(input);
    }),
});
