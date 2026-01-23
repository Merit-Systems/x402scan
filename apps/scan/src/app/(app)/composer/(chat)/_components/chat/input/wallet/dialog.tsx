import { useState } from 'react';

import { ArrowUp, Key } from 'lucide-react';

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

import { Send } from './content/send';
import { WalletExport } from './content/export';

import { OnrampSessionDialog } from './content/onramp-session-dialog';

import { WalletChainProvider } from '@/app/(app)/_contexts/wallet-chain/provider';
import { WalletChain } from '@/app/(app)/_contexts/wallet-chain/component';

import type { SupportedChain } from '@/types/chain';

interface Props {
  children: React.ReactNode;
  chainsWithBalance: [SupportedChain, ...SupportedChain[]];
}

export const WalletDialog: React.FC<Props> = ({
  children,
  chainsWithBalance,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<'send' | 'export'>('send');

  return (
    <WalletChainProvider
      initialChain={chainsWithBalance[0]}
      isFixed={chainsWithBalance.length === 1}
    >
      <OnrampSessionDialog />
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent
          className="p-0 overflow-hidden sm:max-w-md"
          showCloseButton={false}
        >
          <Tabs
            className="w-full overflow-hidden flex flex-col gap-4"
            value={tab}
            onValueChange={value => setTab(value as 'send' | 'export')}
          >
            <DialogHeader className=" gap-2 bg-muted">
              <div className="flex flex-row justify-between items-center p-4">
                <div className="flex flex-row gap-2 items-center">
                  <Logo className="size-8" />
                  <div className="flex flex-col gap-2">
                    <DialogTitle className="text-primary text-xl">
                      Your Composer Wallet
                    </DialogTitle>
                    <DialogDescription className="hidden">
                      This is your wallet.
                    </DialogDescription>
                  </div>
                </div>
                <WalletChain options={chainsWithBalance} />
              </div>
              <TabsList className="w-full h-fit max-w-full overflow-x-auto no-scrollbar">
                <div className="h-[34px] border-b w-4" />
                <TabsTrigger
                  value="send"
                  variant="github"
                  className="data-[state=active]:bg-background"
                >
                  <ArrowUp className="size-4" /> Withdraw
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
            <div className="text-xs font-mono p-4 bg-primary/10 mx-4 rounded-md border-primary border text-primary">
              Composer no longer uses these funds. Withdraw all funds deposited
              on the Composer to your wallet.
            </div>
            <TabsContent
              value="send"
              className="w-full overflow-hidden mt-0 px-4 pb-4"
            >
              <Send />
            </TabsContent>
            <TabsContent
              value="export"
              className="w-full overflow-hidden mt-0 px-4 pb-4"
            >
              <WalletExport />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </WalletChainProvider>
  );
};
