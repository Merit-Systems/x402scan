import { api } from '@/trpc/client';

import { useSession } from 'next-auth/react';
import { Deposit } from '../../../../wallet/deposit';

export const FundWallet = () => {
  const { data: session } = useSession();
  const { data: address } = api.serverWallet.address.useQuery(undefined, {
    enabled: !!session,
  });

  if (!address) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <Deposit address={address} />
      <p className="text-muted-foreground text-xs font-mono p-4 bg-muted border-t text-center">
        These funds will go to your agent&apos;s server wallet and will be used
        to pay for inference and resources via x402.
      </p>
    </div>
  );
};
