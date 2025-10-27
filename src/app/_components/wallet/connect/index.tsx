'use client';

import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Logo } from '@/components/logo';
import { useConnect } from 'wagmi';
import { ConnectWalletForm } from './form';

export const ConnectWalletDialogContent = () => {
  const { connectors } = useConnect();

  const filteredConnectors = connectors.filter(
    connector =>
      connector.type === 'injected' &&
      !['injected', 'cdp-embedded-wallet'].includes(connector.id)
  );

  return (
    <div className="flex flex-col gap-6 max-w-full p-6">
      <DialogHeader className="items-center gap-2">
        <Logo className="size-16" />
        <div className="flex flex-col gap-2">
          <DialogTitle className="text-primary text-xl">
            {filteredConnectors.length > 0 ? 'Connect Wallet' : 'Create Wallet'}
          </DialogTitle>
          <DialogDescription className="hidden">
            Connect your wallet to use on-chain functionality.
          </DialogDescription>
        </div>
      </DialogHeader>
      <ConnectWalletForm />
    </div>
  );
};
