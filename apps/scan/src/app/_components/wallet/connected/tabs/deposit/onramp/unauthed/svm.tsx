import { useSolanaWallet } from '@/app/_contexts/solana/hook';
import { NoSessionContent } from './component';
import { useSiws } from '@/app/_hooks/sign-in/use-siws';
import { UiWalletAccount } from '@wallet-standard/react';

export const NoSVMSessionContent = () => {
  const { connectedWallet } = useSolanaWallet();

  if (!connectedWallet) {
    return null;
  }

  return (
    <SVMSignInContent
      account={connectedWallet.account}
      isEmbeddedWallet={connectedWallet.wallet.features.includes('cdp:')}
    />
  );
};

const SVMSignInContent = ({
  account,
  isEmbeddedWallet,
}: {
  account: UiWalletAccount;
  isEmbeddedWallet: boolean;
}) => {
  const { signIn, isPending } = useSiws({
    account,
    isOnramp: true,
    isEmbeddedWallet,
  });

  return <NoSessionContent onSignIn={signIn} isPending={isPending} />;
};
