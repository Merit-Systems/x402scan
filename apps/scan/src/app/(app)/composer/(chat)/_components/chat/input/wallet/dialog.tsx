import { useState } from "react";

import { ArrowUp, Key } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Logo } from "@/components/logo";

import { Send } from "./content/send";
import { WalletExport } from "./content/export";

import { OnrampSessionDialog } from "./content/onramp-session-dialog";

import { WalletChainProvider } from "@/app/(app)/_contexts/wallet-chain/provider";
import { WalletChain } from "@/app/(app)/_contexts/wallet-chain/component";

import type { SupportedChain } from "@/types/chain";

interface Props {
  children: React.ReactElement;
  chainsWithBalance: [SupportedChain, ...SupportedChain[]];
}

export const WalletDialog: React.FC<Props> = ({
  children,
  chainsWithBalance,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<"send" | "export">("send");

  return (
    <WalletChainProvider
      initialChain={chainsWithBalance[0]}
      isFixed={chainsWithBalance.length === 1}
    >
      <OnrampSessionDialog />
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger render={children} />
        <DialogContent
          className="overflow-hidden p-0 sm:max-w-md"
          showCloseButton={false}
        >
          <Tabs
            className="flex w-full flex-col gap-4 overflow-hidden"
            value={tab}
            onValueChange={(value) => setTab(value as "send" | "export")}
          >
            <DialogHeader className="gap-2 bg-muted">
              <div className="flex flex-row items-center justify-between p-4">
                <div className="flex flex-row items-center gap-2">
                  <Logo className="size-8" />
                  <div className="flex flex-col gap-2">
                    <DialogTitle className="text-xl text-primary">
                      Your Composer Wallet
                    </DialogTitle>
                    <DialogDescription className="hidden">
                      This is your wallet.
                    </DialogDescription>
                  </div>
                </div>
                <WalletChain options={chainsWithBalance} />
              </div>
              <TabsList className="no-scrollbar h-fit w-full max-w-full overflow-x-auto">
                <div className="h-[34px] w-4 border-b" />
                <TabsTrigger
                  value="send"
                  appearance="default"
                  className="data-[state=active]:bg-background"
                >
                  <ArrowUp className="size-4" /> Withdraw
                </TabsTrigger>
                <TabsTrigger
                  value="export"
                  appearance="default"
                  className="data-[state=active]:bg-background"
                >
                  <Key className="size-4" /> Export
                </TabsTrigger>
                <div className="h-[34px] flex-1 border-b" />
              </TabsList>
            </DialogHeader>
            <div className="mx-4 rounded-md border border-primary bg-primary/10 p-4 font-mono text-xs text-primary">
              Composer no longer uses these funds. Withdraw all funds deposited
              on the Composer to your wallet.
            </div>
            <TabsContent
              value="send"
              className="mt-0 w-full overflow-hidden px-4 pb-4"
            >
              <Send />
            </TabsContent>
            <TabsContent
              value="export"
              className="mt-0 w-full overflow-hidden px-4 pb-4"
            >
              <WalletExport />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </WalletChainProvider>
  );
};
