import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from '@/components/ui/animated-tabs';

import Image from 'next/image';

import { Chain } from '@/app/_components/chains';
import { useWalletChain } from '@/app/_contexts/wallet-chain/hook';

import { Onramp } from './onramp';

interface Props {
  tab: 'send' | 'onramp';
  setTab: (tab: 'send' | 'onramp') => void;
  address: string;
  onSuccess: () => void;
}

export const DepositTabs: React.FC<Props> = ({
  tab,
  setTab,
  address,
  onSuccess,
}) => {
  const { chain } = useWalletChain();

  return (
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
          <Chain chain={chain} iconClassName="size-4" />
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
  );
};
