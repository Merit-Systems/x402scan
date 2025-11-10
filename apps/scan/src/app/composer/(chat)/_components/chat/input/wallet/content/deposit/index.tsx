import Image from 'next/image';

import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from '@/components/ui/animated-tabs';

import { Send } from './tabs/send';
import { Onramp } from './tabs/onramp';

import { CopyCode } from '@/components/ui/copy-code';
import { useEthBalance } from '@/app/_hooks/balance/native/use-evm-balance';
import { useEffect } from 'react';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

import type { Address } from 'viem';
import { ServerWalletAddress } from './address';
import { useWalletChain } from '@/app/_contexts/wallet-chain/hook';
import { Chain } from '@/app/_components/chains';

interface Props {
  address: Address;
  onSuccess?: () => void;
}

export const Deposit: React.FC<Props> = ({ address, onSuccess }) => {
  const { chain } = useWalletChain();

  const [tab, setTab] = useState<'send' | 'onramp'>();

  const { data: ethBalance } = useEthBalance();

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
    <div className="flex flex-col gap-4">
      <ServerWalletAddress />
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
            <Chain chain={chain} />
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
        <TabsContents className="mt-1">
          <TabsContent value="send" className="p-1">
            <Send address={address} onSuccess={onSuccess} />
          </TabsContent>
          <TabsContent value="onramp" className="p-1">
            <Onramp />
          </TabsContent>
        </TabsContents>
      </Tabs>
    </div>
  );
};
