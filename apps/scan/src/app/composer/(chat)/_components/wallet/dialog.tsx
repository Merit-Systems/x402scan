import { AlertCircle, ArrowDown, ArrowUp, Key, Wallet } from 'lucide-react';

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

import { WalletDisplay } from './content/display';
import { Send } from './content/send';
import { Deposit } from './content/deposit';

import { api } from '@/trpc/client';

import type { Address } from 'viem';
import { useEffect, useState } from 'react';
import { OnrampSessionDialog } from './content/onramp-session-dialog';
import { useSearchParams } from 'next/navigation';
import { Acknowledgement } from './acknowledgement';
import { WalletExport } from './content/export';

interface Props {
  children: React.ReactNode;
  address: Address;
}

export const WalletDialog: React.FC<Props> = ({ children, address }) => {
  const searchParams = useSearchParams();
  const { data: usdcBalance } =
    api.user.serverWallet.usdcBaseBalance.useQuery();
  const {
    data: hasUserAcknowledgedComposer,
    isLoading: isLoadingHasUserAcknowledgedComposer,
  } = api.user.acknowledgements.hasAcknowledged.useQuery();

  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<'wallet' | 'deposit' | 'send'>('wallet');

  const isOutOfFunds = usdcBalance !== undefined && usdcBalance <= 0.01;

  useEffect(() => {
    const showDeposit =
      isOutOfFunds && !searchParams.get('server_wallet_onramp_token');
    if (showDeposit && hasUserAcknowledgedComposer) {
      setIsOpen(true);
      setTab('deposit');
    }
  }, [searchParams, isOutOfFunds, hasUserAcknowledgedComposer]);

  if (isLoadingHasUserAcknowledgedComposer) {
    return children;
  }

  return (
    <>
      <Acknowledgement />
      <OnrampSessionDialog />
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild disabled={!hasUserAcknowledgedComposer}>
          {children}
        </DialogTrigger>
        <DialogContent
          className="p-0 overflow-hidden sm:max-w-md"
          showCloseButton={false}
        >
          <Tabs
            className="w-full overflow-hidden flex flex-col gap-4"
            value={tab}
            onValueChange={value =>
              setTab(value as 'wallet' | 'deposit' | 'send')
            }
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
              <TabsList className="w-full h-fit max-w-full overflow-x-auto no-scrollbar">
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
                  value="send"
                  variant="github"
                  className="data-[state=active]:bg-background"
                >
                  <ArrowUp className="size-4" /> Send
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
              {isOutOfFunds && (
                <div className="flex flex-row gap-2 items-center mx-4 border-yellow-600 border p-2 bg-yellow-600/20 rounded-md mb-2">
                  <AlertCircle className="size-4 text-yellow-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Agent Out of Funds</p>
                    <p className="text-xs">
                      Please deposit more funds to continue.
                    </p>
                  </div>
                </div>
              )}
              <Deposit address={address} />
            </TabsContent>
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
    </>
  );
};
