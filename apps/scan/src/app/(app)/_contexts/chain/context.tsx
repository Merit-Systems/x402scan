"use client";

import { createContext } from "react";

import type { Chain } from "@/types/chain";

interface ChainContextType {
  chain: Chain | undefined;
  setChain: (chain: Chain | undefined) => void;
}

export const ChainContext = createContext<ChainContextType>({
  chain: undefined,
  setChain: () => {
    void 0;
  },
});
