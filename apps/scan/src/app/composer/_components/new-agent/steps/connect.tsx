'use client';

import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { useSiwe } from '@/app/_hooks/sign-in/use-siwe';
import { useSiws } from '@/app/_hooks/sign-in/use-siws';

import { useSolanaWallet } from '@/app/_contexts/solana/hook';

import type { UiWalletAccount } from '@wallet-standard/react';
import type { ConnectedWallets } from '@/app/_hooks/use-connected-wallets';

import { ConnectWalletForm } from '@/app/_components/wallet/connect/form';
import { WalletChainProvider } from '@/app/_contexts/wallet-chain/provider';
import { useConnectedWallets } from '@/app/_hooks/use-connected-wallets';

export const ConnectStep = () => {
  const connectedWallets = useConnectedWallets();

  if (!connectedWallets.isConnected) {
    return (
      <WalletChainProvider>
        <div className="p-4 flex flex-col gap-2">
          <ConnectWalletForm />
        </div>
      </WalletChainProvider>
    );
  }

  return <Verify connectedWallets={connectedWallets} />;
};

interface Props {
  connectedWallets: ConnectedWallets;
}

const Verify: React.FC<Props> = ({ connectedWallets }) => {
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
    <div className="flex flex-col gap-4 pt-4 ">
      <div className="px-4">
        <Button
          onClick={() => signIn()}
          disabled={isPending}
          className="w-full h-12 md:h-12"
          variant="turbo"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            'Sign Message'
          )}
        </Button>
      </div>
      <div className="p-4 bg-muted border-t">
        <p className="text-muted-foreground text-xs text-center font-mono">
          Sign a message to confirm you own this wallet. This will refresh the
          page.
        </p>
      </div>
    </div>
  );
};
