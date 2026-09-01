"use client";

import { ArrowDown, ArrowUp, Key, Wallet } from "lucide-react";

import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Logo } from "@/components/ui/logo";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ConnectedWalletTabsContent } from "./content";
import { ChainNotConnected } from "./chain-not-connected";

import { WalletChain } from "../../../_contexts/wallet-chain/component";

import { useWalletChain } from "../../../_contexts/wallet-chain/hook";
import { Chain } from "@/types/chain";

import type { User } from "@coinbase/cdp-hooks";
import type { ConnectedWallets } from "@/app/(app)/_hooks/use-connected-wallets";

interface Props {
  connectedWallets: ConnectedWallets;
  user?: User;
  defaultTab?: "wallet" | "deposit" | "withdraw";
}

export const DisplayWalletDialogContent: React.FC<Props> = ({
  connectedWallets,
  user,
  defaultTab = "wallet",
}) => {
  const { chain } = useWalletChain();

  return (
    <div className="flex w-full flex-col gap-4 overflow-hidden">
      <Tabs
        className="flex w-full flex-col gap-6 overflow-hidden"
        defaultValue={defaultTab}
      >
        <DialogHeader className="gap-2 bg-muted">
          <div className="flex justify-between gap-2 p-4">
            <div className="flex flex-row items-center gap-2">
              <Logo className="size-6" />
              <div className="flex flex-col gap-2">
                <DialogTitle className="text-xl text-primary">
                  Your Wallet
                </DialogTitle>
                <DialogDescription className="hidden">
                  This is your wallet.
                </DialogDescription>
              </div>
            </div>
            <WalletChain />
          </div>
          <TabsList className="no-scrollbar h-fit w-full justify-start overflow-x-auto">
            <div className="h-[34px] w-2 shrink-0 border-b" />
            <TabsTrigger
              value="wallet"
              appearance="default"
              className="data-[state=active]:bg-background"
            >
              <Wallet className="size-4" /> Overview
            </TabsTrigger>
            <TabsTrigger
              value="deposit"
              appearance="default"
              className="data-[state=active]:bg-background"
            >
              <ArrowDown className="size-4" /> Deposit
            </TabsTrigger>
            <TabsTrigger
              value="withdraw"
              appearance="default"
              className="data-[state=active]:bg-background"
            >
              <ArrowUp className="size-4" /> Withdraw
            </TabsTrigger>
            {user && (
              <TabsTrigger
                value="export"
                appearance="default"
                className="data-[state=active]:bg-background"
              >
                <Key className="size-4" /> Export
              </TabsTrigger>
            )}
            <div className="h-[34px] min-w-2 flex-1 border-b" />
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
      <DialogFooter className="border-t bg-muted p-4">
        <p className="text-center text-xs text-muted-foreground">
          We do not have access to your keys or the ability to make transactions
          on your behalf.
        </p>
      </DialogFooter>
    </div>
  );
};
