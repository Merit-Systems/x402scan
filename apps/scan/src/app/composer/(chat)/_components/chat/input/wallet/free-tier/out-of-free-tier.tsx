import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { Deposit } from '../../../../wallet/content/deposit';

import { FreeTierButtonContent } from './button';

import type { Address } from 'viem';
import { useEffect, useState } from 'react';
import { Acknowledgement } from '../../../../wallet/acknowledgement';
import { api } from '@/trpc/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowDown, Key } from 'lucide-react';
import { WalletExport } from '../../../../wallet/content/export';

interface Props {
  address: Address;
  hideFreeTierButton: () => void;
}

export const OutOfFreeTier: React.FC<Props> = ({
  address,
  hideFreeTierButton,
}) => {
  const { data: hasUserAcknowledgedComposer } =
    api.user.acknowledgements.hasAcknowledged.useQuery();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (hasUserAcknowledgedComposer) {
      setIsOpen(true);
    }
  }, [hasUserAcknowledgedComposer]);

  const onOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      hideFreeTierButton();
    }
  };

  return (
    <>
      <Acknowledgement />
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          <FreeTierButtonContent />
        </DialogTrigger>
        <DialogContent className="p-0 overflow-hidden">
          <Tabs
            className="w-full overflow-hidden flex flex-col gap-2"
            defaultValue="deposit"
          >
            <DialogHeader className="bg-muted space-y-0">
              <div className="p-4 flex flex-col gap-2">
                <DialogTitle>
                  You Used All of Your Free x402 Credits
                </DialogTitle>
                <DialogDescription>
                  Please fund your agent with USDC to continue.
                </DialogDescription>
              </div>
              <TabsList className="w-full h-fit max-w-full overflow-x-auto no-scrollbar">
                <div className="h-[34px] border-b w-4" />
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
            <TabsContent value="deposit">
              <Deposit address={address} onSuccess={hideFreeTierButton} />
            </TabsContent>
            <TabsContent value="export" className="w-full p-4">
              <p></p>
              <WalletExport />
            </TabsContent>
          </Tabs>
          <p className="text-muted-foreground text-xs font-mono p-4 bg-muted border-t text-center">
            These funds will go to your agent&apos;s server wallet and will be
            used to pay for inference and resources via x402.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
};
