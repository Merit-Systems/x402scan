import React from 'react';

import Image from 'next/image';

import { CopyCode } from '@/components/ui/copy-code';

import { PublicKey } from '@solana/web3.js';

import type { Address } from 'viem';

interface Props {
  address: Address | PublicKey;
}

export const Send: React.FC<Props> = ({ address }) => {
  const isSolana = address instanceof PublicKey;
  const addressString = isSolana ? address.toBase58() : address;
  return (
    <div className="flex flex-col gap-2">
      <div className="gap-1 flex items-center">
        <Image
          src={isSolana ? '/solana.png' : '/base.png'}
          alt="Base"
          height={16}
          width={16}
          className="size-4 inline-block mr-1"
        />
        <span className="font-bold text-sm">
          {isSolana ? 'Send USDC on Solana' : 'Send USDC on Base'}
        </span>
      </div>
      <CopyCode
        code={addressString}
        toastMessage="Address copied to clipboard"
      />
    </div>
  );
};
