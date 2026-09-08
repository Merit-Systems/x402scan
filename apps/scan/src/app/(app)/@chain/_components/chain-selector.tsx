"use client";

import { Globe } from "lucide-react";

import { Suspense } from "react";

import Image from "next/image";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

import { useReplaceSearchParams } from "@/hooks/use-replace-search-params";

import { parseChain } from "@/app/(app)/_lib/chain/parse";
import { CHAIN_ICONS, CHAIN_LABELS, SUPPORTED_CHAINS } from "@/types/chain";

import type { Chain } from "@/types/chain";

export const ChainSelector = () => (
  <Suspense fallback={<LoadingChainSelector />}>
    <ChainSelectorContent />
  </Suspense>
);

function LoadingChainSelector() {
  return (
    <Button
      variant="outline"
      size="default"
      className="w-8 xl:w-32"
      disabled
      aria-label="Loading network filter"
    >
      <Skeleton className="size-4 shrink-0" />
      <Skeleton className="hidden h-4 w-16 xl:block" />
    </Button>
  );
}

const ChainSelectorContent = () => {
  const searchParams = useSearchParams();
  const chain = parseChain(searchParams.get("chain"));
  const replaceSearchParams = useReplaceSearchParams();

  const handleSelectChain = (selectedChain: Chain | undefined) => {
    replaceSearchParams((params) => {
      if (selectedChain) {
        params.set("chain", selectedChain);
      } else {
        params.delete("chain");
      }
      params.delete("p");
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            className="w-8 xl:w-32"
            variant="outline"
            size="default"
            aria-label={
              chain ? `Network: ${CHAIN_LABELS[chain]}` : "Network: All chains"
            }
          />
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
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuRadioGroup value={chain ?? "all"}>
          <DropdownMenuRadioItem
            value="all"
            closeOnClick
            onClick={() => {
              handleSelectChain(undefined);
            }}
          >
            <Globe className="size-4" />
            All
          </DropdownMenuRadioItem>
          {SUPPORTED_CHAINS.map((value) => (
            <DropdownMenuRadioItem
              key={value}
              value={value}
              closeOnClick
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
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
