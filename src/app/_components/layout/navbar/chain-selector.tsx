'use client';

import Image from 'next/image';
import { useChain } from '../../../_contexts/chain/hook';
import { Chain, SUPPORTED_CHAINS } from '@/types/chain';
import { CHAIN_LABELS, CHAIN_ICONS } from '@/types/chain';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Globe } from 'lucide-react';
import { useState } from 'react';

export const ChainSelector = () => {
  const { chain, setChain } = useChain();

  const [isOpen, setIsOpen] = useState(false);

  const handleSelectChain = (chain: Chain | undefined) => {
    setChain(chain);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="navbar" className="md:min-w-[120px]">
          {chain ? (
            <Image
              src={CHAIN_ICONS[chain]}
              alt={CHAIN_LABELS[chain]}
              width={16}
              height={16}
              className="rounded-sm"
            />
          ) : (
            <Globe className="size-4" />
          )}
          <span className="hidden md:block">
            {chain ? CHAIN_LABELS[chain] : 'All Chains'}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[140px] p-1">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 h-8"
          onClick={() => handleSelectChain(undefined)}
        >
          <Globe className="size-4" />
          All
        </Button>
        {Object.values(Chain).map(value => (
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
