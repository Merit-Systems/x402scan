import React from "react";

import Image from "next/image";

import { CopyCode } from "@/components/ui/copy-code";
import { useWalletChain } from "@/app/(app)/composer/_contexts/wallet-chain/hook";
import { CHAIN_ICONS, CHAIN_LABELS } from "@/types/chain";

interface Props {
  address: string;
}

export const Send: React.FC<Props> = ({ address }) => {
  const { chain } = useWalletChain();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Image
          src={CHAIN_ICONS[chain]}
          alt={CHAIN_LABELS[chain]}
          height={16}
          width={16}
          className="inline-block size-4 rounded-full"
        />
        <span className="text-sm font-bold">
          Send USDC on {CHAIN_LABELS[chain]}
        </span>
      </div>
      <CopyCode code={address} toastMessage="Address copied to clipboard" />
    </div>
  );
};
