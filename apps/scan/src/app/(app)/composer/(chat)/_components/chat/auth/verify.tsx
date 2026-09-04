"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useSiwe } from "@/app/(app)/composer/_hooks/sign-in/use-siwe";
import { useSiws } from "@/app/(app)/composer/_hooks/sign-in/use-siws";

import { useSolanaWallet } from "@/app/_contexts/solana/hook";

import type { UiWalletAccount } from "@wallet-standard/react";
import type { ConnectedWallets } from "@/app/(app)/composer/_hooks/use-connected-wallets";

interface Props {
  connectedWallets: ConnectedWallets;
}

export const Verify: React.FC<Props> = ({ connectedWallets }) => {
  if (connectedWallets.evmAddress) {
    return <VerifyEvm />;
  }
  if (connectedWallets.solanaAddress) {
    return <VerifySvm />;
  }

  return null;
};

const VerifyEvm = () => {
  const { signIn, isPending } = useSiwe();

  return <VerifyContent signIn={signIn} isPending={isPending} />;
};

const VerifySvm = () => {
  const { connectedWallet } = useSolanaWallet();

  const VerifySvmContent = ({ account }: { account: UiWalletAccount }) => {
    const { signIn, isPending } = useSiws({
      account,
    });

    return <VerifyContent signIn={signIn} isPending={isPending} />;
  };

  if (!connectedWallet) {
    return null;
  }

  return <VerifySvmContent account={connectedWallet.account} />;
};

interface VerifyProps {
  signIn: () => void;
  isPending: boolean;
}

const VerifyContent: React.FC<VerifyProps> = ({ signIn, isPending }) => {
  return (
    <div className="flex flex-col gap-4 pt-4">
      <div className="px-4">
        <Button
          onClick={() => signIn()}
          disabled={isPending}
          className="h-12 w-full md:h-12"
          variant="default"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Sign Message"
          )}
        </Button>
      </div>
      <div className="border-t bg-muted p-4">
        <p className="text-center font-mono text-xs text-muted-foreground">
          Sign a message to confirm you own this wallet. This will refresh the
          page.
        </p>
      </div>
    </div>
  );
};
