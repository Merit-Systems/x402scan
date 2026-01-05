import { useCallback } from 'react';

import { api } from '@/trpc/client';

import { useConnectedWallets } from '../../use-connected-wallets';

import type { SolanaAddress } from '@/types/address';
import type { UseBalanceReturnType } from '../types';

type Props = {
  tokenMint?: string;
  enabled?: boolean;
  address?: SolanaAddress;
};

export const useSPLTokenBalance = (props?: Props): UseBalanceReturnType => {
  const { tokenMint, enabled, address } = props ?? {};

  const connectedWallets = useConnectedWallets();

  const utils = api.useUtils();

  const addressToQuery = address ?? connectedWallets.solanaAddress ?? '';

  const invalidate = useCallback(() => {
    void utils.public.solana.balance.invalidate({
      ownerAddress: addressToQuery,
      tokenMint,
    });
  }, [addressToQuery, tokenMint, utils]);

  const result = api.public.solana.balance.useQuery(
    {
      ownerAddress: addressToQuery,
      tokenMint,
    },
    {
      enabled: !!addressToQuery && (enabled === undefined || enabled),
      refetchOnMount: 'always',
    }
  );

  return {
    ...result,
    invalidate,
  };
};
