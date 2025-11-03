'use client';

import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Logo } from '@/components/logo';
import { useConnect } from 'wagmi';
import { ConnectWalletForm } from './form';
import { WalletChainSelector } from '../chain-context/selector';

export const ConnectWalletDialogContent = () => {
  const { connectors } = useConnect();

  const filteredConnectors = connectors.filter(
    connector =>
      connector.type === 'injected' &&
      !['injected', 'cdp-embedded-wallet'].includes(connector.id)
  );

  return (
    <div className="flex flex-col gap-6 max-w-full">
      <DialogHeader className="gap-2 bg-muted border-b">
        <div className="flex gap-2 justify-between p-4">
          <div className="flex flex-row gap-2 items-center">
            <Logo className="size-6" />
            <div className="flex flex-col gap-2">
              <DialogTitle className="text-primary text-xl">
                Connect Wallet
              </DialogTitle>
              <DialogDescription className="hidden">
                This is your wallet.
              </DialogDescription>
            </div>
          </div>
          <WalletChainSelector />
        </div>
      </DialogHeader>
      <div className="p-4 pt-0 flex flex-col gap-6">
        <ConnectWalletForm />
      </div>
    </div>
  );
};
