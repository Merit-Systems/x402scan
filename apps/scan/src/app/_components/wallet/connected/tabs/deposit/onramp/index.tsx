'use client';

import Image from 'next/image';

import { useSession } from 'next-auth/react';

import { OnrampContent } from './content';
import { UnauthedOnramp } from './unauthed';

import { useWalletChain } from '@/app/_components/wallet/chain-context/hook';

import { chainToAuthProviderId } from '@/auth/providers/wallet-map';

export const Onramp = () => {
  const { chain } = useWalletChain();

  const { data: session, status } = useSession();

  if (status === 'loading') {
    return null;
  }

  const providerId = chainToAuthProviderId[chain];
  const hasConnectedWallet = session?.user.accounts.some(
    account => account.provider === providerId
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="gap-1 flex items-center">
        <Image
          src="/coinbase.png"
          alt="Base"
          height={16}
          width={16}
          className="size-4 inline-block mr-1 rounded-full"
        />
        <span className="font-bold text-sm">Onramp</span>
      </div>
      {hasConnectedWallet ? <OnrampContent /> : <UnauthedOnramp />}
    </div>
  );
};
