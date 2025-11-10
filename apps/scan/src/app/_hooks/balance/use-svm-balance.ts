import { api } from '@/trpc/client';

import { useConnectedWallets } from '../use-connected-wallets';
import { useCallback } from 'react';
import { SolanaAddress } from '@/types/address';

interface Props {
  tokenMint?: string;
  enabled?: boolean;
  address?: SolanaAddress;
}

export const useSPLTokenBalance = (props?: Props) => {
  const { tokenMint, enabled, address } = props ?? {};

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
        ownerAddress: address ?? connectedWallets.solanaAddress ?? '',
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
