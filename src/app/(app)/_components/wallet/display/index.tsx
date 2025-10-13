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

interface Props {
  address: Address;
  user?: User;
  defaultTab?: 'wallet' | 'deposit' | 'withdraw';
}

export const DisplayWalletDialogContent: React.FC<Props> = ({
  address,
  user,
  defaultTab = 'wallet',
}) => {
  return (
    <div className="w-full overflow-hidden flex flex-col gap-4">
      <Tabs
        className="w-full overflow-hidden flex flex-col gap-6"
        defaultValue={defaultTab}
      >
        <DialogHeader className=" gap-2 bg-muted">
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
        </DialogHeader>

        <TabsContent
          value="wallet"
          className="px-4 w-full overflow-hidden mt-0"
        >
          <EmbeddedWalletContent user={user} address={address} />
        </TabsContent>
        <TabsContent
          value="deposit"
          className="px-4 w-full overflow-hidden mt-0"
        >
          <Deposit address={address} />
        </TabsContent>
        <TabsContent
          value="withdraw"
          className="px-4 w-full overflow-hidden mt-0"
        >
          <Withdraw />
        </TabsContent>
      </Tabs>
      <DialogFooter className="bg-muted border-t p-4">
        <p className="text-xs text-muted-foreground text-center">
          We do not have access to your keys or the ability to make transactions
          on your behalf.
        </p>
      </DialogFooter>
    </div>
  );
};
