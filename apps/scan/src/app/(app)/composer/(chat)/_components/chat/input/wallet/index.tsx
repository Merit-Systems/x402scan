"use client";

import { Bot } from "lucide-react";

import { useSession } from "next-auth/react";

import { PromptInputButton } from "@/components/ai-elements/prompt-input";

import { WalletDialog } from "./dialog";

import { api } from "@/trpc/client";
import { WalletChainProvider } from "@/app/(app)/composer/_contexts/wallet-chain/provider";

import type { SupportedChain } from "@/types/chain";

export const WalletButton = () => {
  const { data: session } = useSession();

  const { data: chainsWithBalances, isLoading: isLoadingChainsWithBalances } =
    api.user.serverWallet.chainsWithBalances.useQuery(undefined, {
      enabled: !!session,
      refetchOnReconnect: false,
      refetchOnMount: false,
    });

  if (isLoadingChainsWithBalances) {
    return null;
  }

  if (!chainsWithBalances) {
    return null;
  }

  const [firstChain, ...otherChains] = chainsWithBalances;
  if (!firstChain) return null;
  const availableChains: [SupportedChain, ...SupportedChain[]] = [
    firstChain,
    ...otherChains,
  ];

  return (
    <WalletChainProvider>
      <WalletDialog chainsWithBalance={availableChains}>
        <PromptInputButton variant="outline" size="sm">
          <Bot className="size-4" />
          <span className="type-caption">Withdraw Funds</span>
        </PromptInputButton>
      </WalletDialog>
    </WalletChainProvider>
  );
};
