import { NoSessionContent } from './component';

import { useSiws } from '@/app/_hooks/sign-in/use-siws';

import { useSolanaWallet } from '@/app/_contexts/solana/hook';

import type { UiWalletAccount } from '@wallet-standard/react';
import { Chain } from '@/types/chain';

export const NoSVMSessionContent = () => {
  const { connectedWallet } = useSolanaWallet();

  if (!connectedWallet) {
    return null;
  }

  return <SVMSignInContent account={connectedWallet.account} />;
};

const SVMSignInContent = ({ account }: { account: UiWalletAccount }) => {
  const { signIn, isPending } = useSiws({
    account,
    redirectParams: {
      onramp: 'true',
      chain: Chain.SOLANA,
    },
  });

  return <NoSessionContent onSignIn={signIn} isPending={isPending} />;
};
