'use client';

import { ArrowDown, ArrowUp, Key, Wallet } from 'lucide-react';

import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Logo } from '@/components/logo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { WalletContent } from './tabs/display/display';
import { Deposit } from './tabs/deposit';

import { WalletChainSelector } from '../chain-context/selector';

import type { User } from '@coinbase/cdp-hooks';
import type { ConnectedWallets } from '@/app/_hooks/use-connected-wallets';
import { useWalletChain } from '../chain-context/hook';
import { ConnectedWalletTabsContent } from './content';
import { Chain } from '@/types/chain';
import { ChainNotConnected } from './chain-not-connected/chain-not-connected';

interface Props {
  connectedWallets: ConnectedWallets;
  user?: User;
  defaultTab?: 'wallet' | 'deposit' | 'withdraw';
}

export const DisplayWalletDialogContent: React.FC<Props> = ({
  connectedWallets,
  user,
  defaultTab = 'wallet',
}) => {
  const { chain } = useWalletChain();

  return (
    <div className="w-full overflow-hidden flex flex-col gap-4">
      <Tabs
        className="w-full overflow-hidden flex flex-col gap-6"
        defaultValue={defaultTab}
      >
        <DialogHeader className="gap-2 bg-muted">
          <div className="flex gap-2 justify-between p-4">
            <div className="flex flex-row gap-2 items-center">
              <Logo className="size-6" />
              <div className="flex flex-col gap-2">
                <DialogTitle className="text-primary text-xl">
                  Your Wallet
                </DialogTitle>
                <DialogDescription className="hidden">
                  This is your wallet.
                </DialogDescription>
              </div>
            </div>
            <WalletChainSelector />
          </div>
          <TabsList className="w-full h-fit overflow-x-auto justify-start no-scrollbar">
            <div className="h-[34px] border-b w-2 shrink-0" />
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
            {user && (
              <TabsTrigger
                value="export"
                variant="github"
                className="data-[state=active]:bg-background"
              >
                <Key className="size-4" /> Export
              </TabsTrigger>
            )}
            <div className="h-[34px] border-b flex-1 min-w-2" />
          </TabsList>
        </DialogHeader>
        {chain === Chain.SOLANA ? (
          connectedWallets.solanaAddress ? (
            <ConnectedWalletTabsContent
              user={user}
              address={connectedWallets.solanaAddress}
            />
          ) : (
            <ChainNotConnected />
          )
        ) : connectedWallets.evmAddress ? (
          <ConnectedWalletTabsContent
            user={user}
            address={connectedWallets.evmAddress}
          />
        ) : (
          <ChainNotConnected />
        )}
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
