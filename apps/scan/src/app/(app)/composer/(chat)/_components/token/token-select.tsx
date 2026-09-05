"use client";

import { useState } from "react";

import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { CHAIN_ICONS } from "@/types/chain";
import { Check, ChevronDown } from "lucide-react";

import type { ButtonProps } from "@/components/ui/button";
import type { Token } from "@/types/token";

type Props = {
  selectedToken: Token;
  onTokenChange?: (token: Token) => void;
  tokens?: Token[];
} & Omit<ButtonProps, "children">;

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
          height={16}
          width={16}
          className="absolute right-0 bottom-0 size-2.5"
        />
      </div>
      <span className="type-supporting-body type-emphasis">
        {selectedToken.symbol}
      </span>
    </div>
  );

  if (!tokens || tokens.length <= 1) {
    return tokenDisplay;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" disabled={props.disabled} {...props}>
          {tokenDisplay}
          <ChevronDown className="size-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px]" align="end">
        <Command>
          <CommandInput placeholder="Search token..." />
          <CommandList>
            <CommandEmpty>No token found.</CommandEmpty>
            <CommandGroup>
              {tokens.map((token) => (
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
                      <span className="type-supporting-body type-emphasis">
                        {token.symbol}
                      </span>
                      <span className="type-caption text-muted-foreground">
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
