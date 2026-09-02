"use client";

import { useState } from "react";
import { ChainContext } from "./context";

import type { Chain } from "@/types/chain";
import { useSearchParams } from "next/navigation";
import { parseChain } from "@/app/(app)/_lib/chain/parse";
import {
  getDataChainCookieClient,
  setDataChainCookieClient,
} from "./cookies/client";

interface Props {
  children: React.ReactNode;
}

export const ChainProvider: React.FC<Props> = ({ children }) => {
  const searchParams = useSearchParams();
  const urlChain = parseChain(searchParams.get("chain"));
  const [storedChain, setStoredChain] = useState<Chain | undefined>(() =>
    getDataChainCookieClient()
  );
  const chain = urlChain ?? storedChain;

  const setChain = (chain: Chain | undefined) => {
    setDataChainCookieClient(chain);
    setStoredChain(chain);
  };

  return (
    <ChainContext.Provider value={{ chain, setChain }}>
      {children}
    </ChainContext.Provider>
  );
};
