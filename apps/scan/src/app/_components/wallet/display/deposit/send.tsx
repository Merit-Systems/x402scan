import React from 'react';

import Image from 'next/image';

import { CopyCode } from '@/components/ui/copy-code';

interface Props {
  address: string;
}

export const Send: React.FC<Props> = ({ address }) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="gap-1 flex items-center">
        <Image
          src="/base.png"
          alt="Base"
          height={16}
          width={16}
          className="size-4 inline-block mr-1"
        />
        <span className="font-bold text-sm">Send USDC on Base</span>
      </div>
      <CopyCode code={address} toastMessage="Address copied to clipboard" />
    </div>
  );
};
