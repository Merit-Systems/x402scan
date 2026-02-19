import { useCallback, useMemo } from 'react';

import { skipToken } from '@tanstack/react-query';

import { api } from '@/trpc/client';

import { useConnectedWallets } from '../../use-connected-wallets';

import type { SolanaAddress } from '@/types/address';
import type { UseBalanceReturnType } from '../types';
import { solanaAddressSchema } from '@/lib/schemas';

interface Props {
  tokenMint?: string;
  enabled?: boolean;
  address?: SolanaAddress;
}

export const useSPLTokenBalance = (props?: Props): UseBalanceReturnType => {
  const { tokenMint, enabled, address } = props ?? {};

  const connectedWallets = useConnectedWallets();

  const utils = api.useUtils();

  const addressToQuery = address ?? connectedWallets.solanaAddress;

  const isValidAddress = useMemo(
    () =>
      !!addressToQuery && solanaAddressSchema.safeParse(addressToQuery).success,
    [addressToQuery]
  );

  const isEnabled = isValidAddress && (enabled === undefined || enabled);

  const invalidate = useCallback(() => {
    if (!addressToQuery) return;
    void utils.public.solana.balance.invalidate({
      ownerAddress: addressToQuery,
      tokenMint,
    });
  }, [addressToQuery, tokenMint, utils]);

  const result = api.public.solana.balance.useQuery(
    isEnabled
      ? {
          ownerAddress: addressToQuery!,
          tokenMint,
        }
      : skipToken,
    {
      refetchOnMount: 'always',
    }
  );

  return {
    ...result,
    invalidate,
  };
};
