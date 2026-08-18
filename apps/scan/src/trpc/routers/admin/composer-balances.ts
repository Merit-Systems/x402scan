import { adminProcedure, createTRPCRouter } from '../../trpc';
import { getComposerBalancesReport } from '@/services/composer-balances';

export const adminComposerBalancesRouter = createTRPCRouter({
  report: adminProcedure.query(async () => {
    return await getComposerBalancesReport();
  }),
});
