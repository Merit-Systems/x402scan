import React from 'react';

import Image from 'next/image';

import { CopyCode } from '@/components/ui/copy-code';
import { useWalletChain } from '../../../../../_contexts/wallet-chain/hook';
import { CHAIN_ICONS, CHAIN_LABELS } from '@/types/chain';

type Props = {
  address: string;
};

export const Send: React.FC<Props> = ({ address }) => {
  const { chain } = useWalletChain();

  return (
    <div className="flex flex-col gap-2">
      <div className="gap-2 flex items-center">
        <Image
          src={CHAIN_ICONS[chain]}
          alt={CHAIN_LABELS[chain]}
          height={16}
          width={16}
          className="size-4 inline-block rounded-full"
        />
        <span className="font-bold text-sm">
          Send USDC on {CHAIN_LABELS[chain]}
        </span>
      </div>
      <CopyCode code={address} toastMessage="Address copied to clipboard" />
    </div>
  );
};
