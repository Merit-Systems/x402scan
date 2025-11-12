'use client';

import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Logo } from '@/components/logo';
import { ConnectWalletForm } from './form';
import { WalletChain } from '../../../_contexts/wallet-chain/component';

export const ConnectWalletDialogContent = () => {
  return (
    <div className="flex flex-col gap-4 max-w-full">
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
          <WalletChain />
        </div>
      </DialogHeader>
      <div className="p-4 pt-0 flex flex-col gap-6">
        <ConnectWalletForm />
      </div>
    </div>
  );
};
