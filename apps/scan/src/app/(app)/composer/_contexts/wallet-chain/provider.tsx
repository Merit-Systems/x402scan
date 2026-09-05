"use client";

import { useCallback, useMemo, useState } from "react";
import { WalletChainContext } from "./context";

import { Chain } from "@/types/chain";

import type { ConnectedWallets } from "@/app/(app)/composer/_hooks/use-connected-wallets";
import type { SupportedChain } from "@/types/chain";

interface Props {
  children: React.ReactNode;
  connectedWallets?: ConnectedWallets;
  initialChain?: SupportedChain;
  isFixed?: boolean;
}

export const WalletChainProvider: React.FC<Props> = ({
  children,
  connectedWallets,
  initialChain,
  isFixed = false,
}) => {
  const [chain, setChainState] = useState<SupportedChain>(
    initialChain ??
      (!connectedWallets || connectedWallets.evmAddress
        ? Chain.BASE
        : Chain.SOLANA)
  );

  const setChain = useCallback((chain: SupportedChain) => {
    setChainState(chain);
  }, []);
  const value = useMemo(
    () => ({ chain, setChain, isFixed }),
    [chain, setChain, isFixed]
  );

  return (
    <WalletChainContext.Provider value={value}>
      {children}
    </WalletChainContext.Provider>
  );
};
