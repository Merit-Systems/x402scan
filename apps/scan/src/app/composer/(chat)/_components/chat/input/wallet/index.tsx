import { api } from '@/trpc/client';
import { LoadingWalletButton } from './button';
import { FreeTierButton } from './free-tier';
import { ServerWalletButton } from './server-wallet';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export const WalletButton = () => {
  const { data: session } = useSession();

  const { data: freeTierUsage, isLoading } = api.user.freeTier.usage.useQuery(
    undefined,
    {
      enabled: !!session,
    }
  );

  const [showFreeTier, setShowFreeTier] = useState(false);

  useEffect(() => {
    if (freeTierUsage?.hasFreeTier) {
      setShowFreeTier(true);
    }
  }, [freeTierUsage]);

  if (!session) {
    return null;
  }

  if (isLoading) {
    return <LoadingWalletButton />;
  }

  if (freeTierUsage?.hasFreeTier || showFreeTier) {
    return <FreeTierButton hideFreeTierButton={() => setShowFreeTier(false)} />;
  }

  return <ServerWalletButton />;
};
