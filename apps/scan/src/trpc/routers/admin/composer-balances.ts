import { getComposerBalancesReport } from "@/services/composer-balances";

import { adminProcedure, createTRPCRouter } from "../../trpc";

export const adminComposerBalancesRouter = createTRPCRouter({
  report: adminProcedure.query(async () => {
    return getComposerBalancesReport();
  }),
});
