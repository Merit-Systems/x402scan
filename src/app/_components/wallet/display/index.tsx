'use client';

import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Logo } from '@/components/logo';

import { EmbeddedWalletContent } from './content';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowDown, ArrowUp, Wallet } from 'lucide-react';
import { Deposit } from './deposit';
import { Withdraw } from './withdraw';

import type { Address } from 'viem';
import type { User } from '@coinbase/cdp-hooks';
import type { PublicKey } from '@solana/web3.js';
import { useState } from 'react';

export type Addresses =
  | {
      evm: Address;
      svm: PublicKey;
    }
  | {
      evm: Address;
      svm: undefined;
    }
  | {
      evm: undefined;
      svm: PublicKey;
    };

interface Props {
  addresses: Addresses;
  user?: User;
  defaultTab?: 'wallet' | 'deposit' | 'withdraw';
}

export const DisplayWalletDialogContent: React.FC<Props> = ({
  addresses,
  user,
  defaultTab = 'wallet',
}) => {
  const [vm, setVm] = useState<'evm' | 'svm'>(addresses.evm ? 'evm' : 'svm');

  const hasWalletForVm =
    (vm === 'evm' && addresses.evm !== undefined) ||
    (vm === 'svm' && addresses.svm !== undefined);

  return (
    <div className="w-full overflow-hidden flex flex-col gap-4">
      <Tabs
        className="w-full overflow-hidden flex flex-col gap-6"
        defaultValue={defaultTab}
      >
        <DialogHeader className="gap-2 bg-muted">
          <div className="flex flex-row gap-2 items-center justify-between">
            <div className="flex flex-row gap-2 items-center p-4">
              <Logo className="size-8" />
              <div className="flex flex-col gap-2">
                <DialogTitle className="text-primary text-xl">
                  Your Wallet
                </DialogTitle>
                <DialogDescription className="hidden">
                  This is your wallet.
                </DialogDescription>
              </div>
            </div>
            <Tabs
              value={vm}
              onValueChange={value => setVm(value as 'evm' | 'svm')}
            >
              <TabsList className="w-full h-fit gap-0 pr-2">
                <TabsTrigger value="evm" variant="ghost">
                  EVM
                </TabsTrigger>
                <TabsTrigger value="svm" variant="ghost">
                  Solana
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {hasWalletForVm && (
            <TabsList className="w-full h-fit">
              <div className="h-[34px] border-b w-4" />
              <TabsTrigger
                value="wallet"
                variant="github"
                className="data-[state=active]:bg-background"
              >
                <Wallet className="size-4" /> Overview
              </TabsTrigger>
              <TabsTrigger
                value="deposit"
                variant="github"
                className="data-[state=active]:bg-background"
              >
                <ArrowDown className="size-4" /> Deposit
              </TabsTrigger>
              <TabsTrigger
                value="withdraw"
                variant="github"
                className="data-[state=active]:bg-background"
              >
                <ArrowUp className="size-4" /> Withdraw
              </TabsTrigger>
              <div className="h-[34px] border-b flex-1" />
            </TabsList>
          )}
        </DialogHeader>

        {hasWalletForVm && (
          <>
            <TabsContent
              value="wallet"
              className="px-4 w-full overflow-hidden mt-0"
            >
              <EmbeddedWalletContent
                user={user}
                address={vm === 'evm' ? addresses.evm! : addresses.svm!}
              />
            </TabsContent>
            <TabsContent
              value="deposit"
              className="px-4 w-full overflow-hidden mt-0"
            >
              <Deposit
                address={vm === 'evm' ? addresses.evm! : addresses.svm!}
              />
            </TabsContent>
            <TabsContent
              value="withdraw"
              className="px-4 w-full overflow-hidden mt-0"
            >
              <Withdraw />
            </TabsContent>
          </>
        )}
        <DialogFooter className="p-2" />
      </Tabs>
    </div>
  );
};
