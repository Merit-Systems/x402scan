'use client';

import Image from 'next/image';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

import { Token } from '@/types/token';
import { ButtonProps } from '../button';
import { CHAIN_ICONS } from '@/types/chain';
import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface Props extends Omit<ButtonProps, 'children'> {
  selectedToken: Token;
  onTokenChange?: (token: Token) => void;
  tokens?: Token[];
}

export const TokenSelect: React.FC<Props> = ({
  selectedToken,
  tokens,
  onTokenChange,
  ...props
}) => {
  const [open, setOpen] = useState(false);

  const tokenDisplay = (
    <div className="flex items-center gap-2">
      <div className="relative size-6 shrink-0">
        <Image
          src={selectedToken.icon}
          alt={selectedToken.symbol}
          height={48}
          width={48}
          className="rounded-full object-cover"
        />
        <Image
          src={CHAIN_ICONS[selectedToken.chain]}
          alt={selectedToken.chain}
          height={10}
          width={10}
          className="size-2 absolute bottom-0 right-0"
        />
      </div>
      <span className="text-base font-semibold">{selectedToken.symbol}</span>
    </div>
  );

  if (!tokens || tokens.length <= 1) {
    return tokenDisplay;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="h-fit gap-2 p-2 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none rounded-full"
          disabled={props.disabled}
          {...props}
        >
          {tokenDisplay}
          <ChevronDown className="text-muted-foreground size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="end">
        <Command>
          <CommandInput placeholder="Search token..." />
          <CommandList>
            <CommandEmpty>No token found.</CommandEmpty>
            <CommandGroup>
              {tokens.map(token => (
                <CommandItem
                  key={token.symbol}
                  value={token.symbol}
                  onSelect={() => {
                    onTokenChange?.(token);
                    setOpen(false);
                  }}
                >
                  <div className="flex flex-1 items-center gap-2">
                    <div className="relative size-5 shrink-0">
                      <Image
                        src={token.icon}
                        alt={token.symbol}
                        fill
                        className="rounded-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {token.symbol}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {token.name}
                      </span>
                    </div>
                  </div>
                  {selectedToken.symbol === token.symbol && (
                    <Check className="size-4" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
