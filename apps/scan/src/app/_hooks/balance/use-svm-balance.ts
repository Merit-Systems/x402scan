import { api } from '@/trpc/client';

import { useConnectedWallets } from '../use-connected-wallets';
import { useCallback } from 'react';

export const useSPLTokenBalance = (tokenMint?: string, enabled?: boolean) => {
  const connectedWallets = useConnectedWallets();

  const utils = api.useUtils();

  const invalidate = useCallback(() => {
    void utils.public.solana.balance.invalidate({
      ownerAddress: connectedWallets.solanaAddress ?? '',
      tokenMint,
    });
  }, [connectedWallets.solanaAddress, tokenMint, utils]);

  return {
    ...api.public.solana.balance.useQuery(
      {
        ownerAddress: connectedWallets.solanaAddress ?? '',
        tokenMint,
      },
      {
        enabled:
          !!connectedWallets.solanaAddress &&
          (enabled === undefined || enabled),
      }
    ),
    invalidate,
  };
};
