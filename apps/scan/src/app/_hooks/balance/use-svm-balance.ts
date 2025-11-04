import { api } from '@/trpc/client';

import { useConnectedWallets } from '../use-connected-wallets';

export const useSPLTokenBalance = (tokenMint?: string, enabled?: boolean) => {
  const connectedWallets = useConnectedWallets();

  return api.public.solana.balance.useQuery(
    {
      ownerAddress: connectedWallets.solanaAddress ?? '',
      tokenMint,
    },
    {
      enabled:
        !!connectedWallets.solanaAddress && (enabled === undefined || enabled),
    }
  );
};
