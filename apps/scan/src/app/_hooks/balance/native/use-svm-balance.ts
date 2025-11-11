import { useCallback } from 'react';

import { api } from '@/trpc/client';

import { useConnectedWallets } from '../../use-connected-wallets';

import type { SolanaAddress } from '@/types/address';
import type { UseBalanceReturnType } from '../types';

interface Props {
  enabled?: boolean;
  address?: SolanaAddress;
}

export const useSolanaNativeBalance = (props?: Props): UseBalanceReturnType => {
  const { enabled, address } = props ?? {};

  const connectedWallets = useConnectedWallets();

  const utils = api.useUtils();

  const addressToQuery = address ?? connectedWallets.solanaAddress ?? '';

  const invalidate = useCallback(() => {
    void utils.public.solana.nativeBalance.invalidate(addressToQuery);
  }, [addressToQuery, utils]);

  const result = api.public.solana.nativeBalance.useQuery(addressToQuery, {
    enabled: !!addressToQuery && (enabled === undefined || enabled),
  });

  return {
    ...result,
    invalidate,
  };
};
