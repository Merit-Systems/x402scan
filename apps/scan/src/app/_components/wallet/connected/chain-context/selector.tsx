'use client';

import { useState } from 'react';

import Image from 'next/image';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { useWalletChain } from './hook';

import {
  Chain,
  SUPPORTED_CHAINS,
  CHAIN_LABELS,
  CHAIN_ICONS,
} from '@/types/chain';

export const WalletChainSelector = () => {
  const { chain, setChain } = useWalletChain();

  const [isOpen, setIsOpen] = useState(false);

  const handleSelectChain = (chain: Chain) => {
    setChain(chain);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="navbar" className="md:min-w-[120px]">
          <Image
            src={CHAIN_ICONS[chain]}
            alt={CHAIN_LABELS[chain]}
            width={16}
            height={16}
            className="rounded-sm"
          />
          <span className="hidden md:block">{CHAIN_LABELS[chain]}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[140px] p-1">
        {SUPPORTED_CHAINS.map(value => (
          <Button
            key={value}
            variant="ghost"
            className="w-full justify-start gap-2 h-8"
            onClick={() => handleSelectChain(value)}
            disabled={!SUPPORTED_CHAINS.includes(value)}
          >
            <Image
              src={CHAIN_ICONS[value]}
              alt={CHAIN_LABELS[value]}
              width={16}
              height={16}
              className="rounded-sm"
            />
            {CHAIN_LABELS[value]}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  );
};
