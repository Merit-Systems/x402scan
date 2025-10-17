import { ArrowDown, Key, Wallet } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Logo } from '@/components/logo';

import { WalletDisplay } from './display';

import { Deposit } from './deposit';

import type { Address } from 'viem';
import { ExportWallet } from './export';

interface Props {
  children: React.ReactNode;
  address: Address;
}

export const WalletDialog: React.FC<Props> = ({ children, address }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="p-0 overflow-hidden sm:max-w-md"
        showCloseButton={false}
      >
        <Tabs
          className="w-full overflow-hidden flex flex-col gap-4"
          defaultValue="wallet"
        >
          <DialogHeader className=" gap-2 bg-muted">
            <div className="flex flex-row gap-2 items-center p-4">
              <Logo className="size-8" />
              <div className="flex flex-col gap-2">
                <DialogTitle className="text-primary text-xl">
                  Your Server Wallet
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
                value="export"
                variant="github"
                className="data-[state=active]:bg-background"
              >
                <Key className="size-4" /> Export
              </TabsTrigger>
              <div className="h-[34px] border-b flex-1" />
            </TabsList>
          </DialogHeader>

          <TabsContent
            value="wallet"
            className="px-4 w-full overflow-hidden mt-0 pb-4"
          >
            <WalletDisplay address={address} />
          </TabsContent>
          <TabsContent
            value="deposit"
            className="w-full overflow-hidden mt-0 flex flex-col gap-2 pb-4"
          >
            <Deposit address={address} />
          </TabsContent>
          <TabsContent value="export" className="w-full overflow-hidden mt-0">
            <ExportWallet />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
