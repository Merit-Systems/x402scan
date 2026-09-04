"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Globe } from "lucide-react";

import { useChain } from "../../../_contexts/chain/hook";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useReplaceSearchParams } from "@/hooks/use-replace-search-params";
import { CHAIN_ICONS, CHAIN_LABELS, SUPPORTED_CHAINS } from "@/types/chain";

import type { Chain } from "@/types/chain";

const URL_BACKED_CHAIN_ROUTES = new Set(["/", "/facilitators", "/networks"]);

export const ChainSelector = () => {
  const { chain, setChain } = useChain();
  const pathname = usePathname();
  const replaceSearchParams = useReplaceSearchParams();

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
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
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
