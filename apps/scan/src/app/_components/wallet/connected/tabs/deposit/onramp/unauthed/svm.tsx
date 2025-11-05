import { NoSessionContent } from './component';

import { useSiws } from '@/app/_hooks/sign-in/use-siws';

import { useSolanaWallet } from '@/app/_contexts/solana/hook';

import type { UiWalletAccount } from '@wallet-standard/react';

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
    isOnramp: true,
  });

  return <NoSessionContent onSignIn={signIn} isPending={isPending} />;
};
