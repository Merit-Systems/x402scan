import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from '@/components/ui/animated-tabs';

import Image from 'next/image';

import { Chain } from '@/app/_components/chains';

import { Onramp } from './onramp';
import { SendToServerWallet } from './send';

import { DepositTab } from '../types';

import type { SupportedChain } from '@/types/chain';

interface Props {
  tab: DepositTab;
  setTab: (tab: DepositTab) => void;
  chain: SupportedChain;
  onSuccess?: () => void;
}

export const DepositTabsContent: React.FC<Props> = ({
  tab,
  setTab,
  chain,
  onSuccess,
}) => {
  return (
    <Tabs
      className="flex flex-col gap-0"
      value={tab}
      onValueChange={value => setTab(value)}
    >
      <TabsList className="w-full justify-start gap-2 rounded-md h-fit">
        <TabsTrigger
          value={DepositTab.SEND}
          className="flex-1 flex items-center gap-2 py-2"
        >
          <Chain chain={chain} iconClassName="size-4" />
          Send
        </TabsTrigger>
        <TabsTrigger
          value={DepositTab.ONRAMP}
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
          <SendToServerWallet chain={chain} onSuccess={onSuccess} />
        </TabsContent>
        <TabsContent value="onramp" className="p-1">
          <Onramp chain={chain} />
        </TabsContent>
      </TabsContents>
    </Tabs>
  );
};
