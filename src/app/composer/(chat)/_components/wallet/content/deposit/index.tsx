import Image from 'next/image';

import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from '@/components/ui/animated-tabs';

import { Send } from './send';
import { Onramp } from './onramp';

import { CopyCode } from '@/components/ui/copy-code';
import { useEthBalance } from '@/app/_hooks/use-eth-balance';
import { useEffect } from 'react';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

import type { Address } from 'viem';

interface Props {
  address: Address;
  onSuccess?: () => void;
}

export const Deposit: React.FC<Props> = ({ address, onSuccess }) => {
  const [tab, setTab] = useState<'send' | 'onramp'>();

  const { data: ethBalance, isLoading: isEthBalanceLoading } = useEthBalance();

  useEffect(() => {
    if (ethBalance !== undefined) {
      if (ethBalance > 0) {
        setTab('send');
      } else {
        setTab('onramp');
      }
    }
  }, [ethBalance]);

  return (
    <div className="flex flex-col gap-4 px-4">
      <div className="flex flex-col gap-1">
        <span className="font-medium text-sm">Your Agent Wallet Address</span>
        <CopyCode code={address} toastMessage="Address copied to clipboard" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-medium text-sm">Add Funds</span>
        <Tabs
          className="flex flex-col gap-0"
          value={tab ?? ''}
          onValueChange={value => setTab(value as 'send' | 'onramp')}
        >
          <TabsList className="w-full justify-start gap-2 rounded-md h-fit">
            <TabsTrigger
              value="send"
              className="flex-1 flex items-center gap-2 py-2"
            >
              <Image src="/base.png" alt="Base" height={16} width={16} />
              Send
            </TabsTrigger>
            <TabsTrigger
              value="onramp"
              className="flex-1 flex items-center gap-2 py-2"
            >
              <Image
                src="/coinbase.png"
                alt="Coinbase"
                height={16}
                width={16}
                className="size-4 rounded-full"
              />
              Onramp
            </TabsTrigger>
          </TabsList>
          {isEthBalanceLoading && ethBalance === undefined ? (
            <div className="mt-1 p-2 flex flex-col gap-2">
              <Skeleton className="w-full h-[44px]" />
              <Skeleton className="w-full h-9" />
            </div>
          ) : (
            <TabsContents className="mt-1">
              <TabsContent value="send" className="p-1">
                <Send address={address} onSuccess={onSuccess} />
              </TabsContent>
              <TabsContent value="onramp">
                <Onramp />
              </TabsContent>
            </TabsContents>
          )}
        </Tabs>
      </div>
    </div>
  );
};
