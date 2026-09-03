"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useChain } from "../../../_contexts/chain/hook";
import { SUPPORTED_CHAINS } from "@/types/chain";
import { CHAIN_LABELS, CHAIN_ICONS } from "@/types/chain";

import type { Chain } from "@/types/chain";
import { Button } from "@/components/ui/button";
import { useReplaceSearchParams } from "@/hooks/use-replace-search-params";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Globe } from "lucide-react";
import { useState } from "react";

const URL_BACKED_CHAIN_ROUTES = new Set(["/", "/facilitators", "/networks"]);

export const ChainSelector = () => {
  const { chain, setChain } = useChain();
  const pathname = usePathname();
  const replaceSearchParams = useReplaceSearchParams();

  const [isOpen, setIsOpen] = useState(false);

  const handleSelectChain = (selectedChain: Chain | undefined) => {
    setChain(selectedChain);

    if (URL_BACKED_CHAIN_ROUTES.has(pathname)) {
      replaceSearchParams((params) => {
        if (selectedChain) {
          params.set("chain", selectedChain);
        } else {
          params.delete("chain");
        }
        params.delete("p");
      });
    }

    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="default"
          aria-label={
            chain ? `Network: ${CHAIN_LABELS[chain]}` : "Network: All chains"
          }
        >
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
          <span className="hidden xl:block">
            {chain ? CHAIN_LABELS[chain] : "All Chains"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[140px] p-1">
        <Button
          variant="ghost"
          className="h-8 w-full justify-start gap-2"
          onClick={() => {
            handleSelectChain(undefined);
          }}
        >
          <Globe className="size-4" />
          All
        </Button>
        {SUPPORTED_CHAINS.map((value) => (
          <Button
            key={value}
            variant="ghost"
            className="h-8 w-full justify-start gap-2"
            onClick={() => {
              handleSelectChain(value);
            }}
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
