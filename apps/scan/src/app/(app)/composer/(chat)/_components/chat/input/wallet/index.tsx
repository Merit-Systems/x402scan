'use client';

import { Bot } from 'lucide-react';

import { useSession } from 'next-auth/react';

import { PromptInputButton } from '@/components/ai-elements/prompt-input';

import { WalletDialog } from './dialog';

import { api } from '@/trpc/client';
import { WalletChainProvider } from '@/app/(app)/_contexts/wallet-chain/provider';

import type { SupportedChain } from '@/types/chain';

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

  // if (chainsWithBalances.length === 0) {
  //   return null;
  // }

  return (
    <WalletChainProvider>
      <WalletDialog
        chainsWithBalance={
          chainsWithBalances as [SupportedChain, ...SupportedChain[]]
        }
      >
        <PromptInputButton variant="primaryOutline" size="sm">
          <Bot className="size-4" />
          <span className="text-xs">Withdraw Funds</span>
        </PromptInputButton>
      </WalletDialog>
    </WalletChainProvider>
  );
};
