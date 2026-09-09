import { useSiws } from "@/app/(app)/composer/_hooks/sign-in/use-siws";

import { useSolanaWallet } from "@/app/_contexts/solana/hook";
import { Chain } from "@/types/chain";

import { NoSessionContent } from "./component";

import type { UiWalletAccount } from "@wallet-standard/react";

export const NoSVMSessionContent = () => {
  const { connectedWallet } = useSolanaWallet();

  if (!connectedWallet) {
    return null;
  }

  return <SVMSignInContent account={connectedWallet.account} />;
};

interface SVMSignInContentProps {
  account: UiWalletAccount;
}

const SVMSignInContent = ({ account }: SVMSignInContentProps) => {
  const { signIn, isPending } = useSiws({
    account,
    redirectParams: {
      onramp: "true",
      chain: Chain.SOLANA,
    },
  });

  return <NoSessionContent onSignIn={signIn} isPending={isPending} />;
};
