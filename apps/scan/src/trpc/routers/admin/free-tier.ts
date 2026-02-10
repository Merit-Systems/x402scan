import { TRPCError } from '@trpc/server';

import { Chain } from '@/types/chain';
import { createTRPCRouter, adminProcedure } from '../../trpc';
import { freeTierWallets } from '@/services/cdp/server-wallet/free-tier';

export const adminFreeTierRouter = createTRPCRouter({
  address: adminProcedure.query(async () => {
    const result = await freeTierWallets[Chain.BASE].address();
    if (result.isErr()) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: result.error.message,
      });
    }
    return result.value;
  }),
});
