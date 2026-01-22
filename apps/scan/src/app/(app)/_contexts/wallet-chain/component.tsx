'use client';

import { useState } from 'react';

import { ChevronDown } from 'lucide-react';

import Image from 'next/image';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { Chain } from '@/app/(app)/_components/chains';

import { useWalletChain } from './hook';

import { SUPPORTED_CHAINS, CHAIN_LABELS, CHAIN_ICONS } from '@/types/chain';

import type { SupportedChain } from '@/types/chain';

interface Props {
  options?: SupportedChain[];
}

export const WalletChain: React.FC<Props> = ({ options }) => {
  const { isFixed } = useWalletChain();

  if (!isFixed) {
    return <WalletChainSelector options={options} />;
  }

  return <ChainDisplay />;
};

const ChainDisplay = () => {
  const { chain } = useWalletChain();

  return (
    <div className="flex items-center gap-2 font-medium">
      <Chain chain={chain} iconClassName="size-4" />
      <span className="hidden md:block">{CHAIN_LABELS[chain]}</span>
    </div>
  );
};

const WalletChainSelector: React.FC<Props> = ({ options }) => {
  const { chain, setChain } = useWalletChain();

  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="">
          <Image
            src={CHAIN_ICONS[chain]}
            alt={CHAIN_LABELS[chain]}
            width={16}
            height={16}
            className="rounded-sm"
          />
          <span className="hidden md:block">{CHAIN_LABELS[chain]}</span>
          <ChevronDown className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[140px] p-1">
        {(options ?? SUPPORTED_CHAINS).map(value => (
          <Button
            key={value}
            variant="ghost"
            className="w-full justify-start gap-2 h-8"
            onClick={() => {
              setChain(value);
              setIsOpen(false);
            }}
            disabled={!SUPPORTED_CHAINS.includes(value)}
          >
            <Chain chain={value} iconClassName="size-4" />
            {CHAIN_LABELS[value]}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  );
};
