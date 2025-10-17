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

import type { Address } from 'viem';
import { CopyCode } from '@/components/ui/copy-code';

interface Props {
  address: Address;
}

export const Deposit: React.FC<Props> = ({ address }) => {
  return (
    <div className="flex flex-col gap-4 px-4">
      <div className="flex flex-col gap-1">
        <span className="font-medium text-sm">Your Agent Wallet Address</span>
        <CopyCode code={address} toastMessage="Address copied to clipboard" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-medium text-sm">Add Funds</span>
        <Tabs defaultValue="send" className="flex flex-col gap-0">
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
          <TabsContents className="mt-1">
            <TabsContent value="send" className="p-1">
              <Send address={address} />
            </TabsContent>
            <TabsContent value="onramp" className="m-2">
              <Onramp />
            </TabsContent>
          </TabsContents>
        </Tabs>
      </div>
    </div>
  );
};
