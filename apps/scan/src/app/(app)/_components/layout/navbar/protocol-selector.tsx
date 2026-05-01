'use client';

import { Layers } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { useProtocol } from '@/app/(app)/_contexts/protocol/hook';
import { SEARCH_PROTOCOLS } from '@/app/(app)/_contexts/protocol/keys';

import type { SearchProtocol } from '@/features/search-box';

const PROTOCOL_LABELS: Record<SearchProtocol, string> = {
  x402: 'x402',
  mpp: 'MPP',
};

export const ProtocolSelector = () => {
  const { protocol, setProtocol } = useProtocol();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (next: SearchProtocol | undefined) => {
    setProtocol(next);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="navbar">
          <Layers className="size-4" />
          <span className="hidden md:block">
            {protocol ? PROTOCOL_LABELS[protocol] : 'All Protocols'}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[140px] p-1">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 h-8"
          onClick={() => handleSelect(undefined)}
        >
          <Layers className="size-4" />
          All
        </Button>
        {SEARCH_PROTOCOLS.map(value => (
          <Button
            key={value}
            variant="ghost"
            className="w-full justify-start gap-2 h-8"
            onClick={() => handleSelect(value)}
          >
            {PROTOCOL_LABELS[value]}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  );
};
