'use client';

import { useCallback, useState } from 'react';

import { Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { TokenInput } from '@/components/ui/token/token-input';

import { api } from '@/trpc/client';

import { BASE_USDC } from '@/lib/tokens/usdc';

import { useWalletChain } from '@/app/_contexts/wallet-chain/hook';

import type { SupportedChain } from '@/types/chain';

export const Onramp = () => {
  const { chain } = useWalletChain();

  const {
    mutate: createOnrampSession,
    isPending: isCreatingOnrampSession,
    isSuccess: isCreatedOnrampSession,
  } = api.user.onrampSessions.serverWallet.create.useMutation({
    onSuccess: url => {
      window.location.href = url;
    },
  });

  const [amount, setAmount] = useState(0);

  const handleSubmit = useCallback(() => {
    createOnrampSession({
      amount,
      redirect: window.location.href,
      defaultNetwork: chain as SupportedChain,
    });
  }, [amount, createOnrampSession]);

  return (
    <div className="flex flex-col gap-2">
      <TokenInput
        onChange={setAmount}
        selectedToken={BASE_USDC}
        label="Buy on Coinbase"
        placeholder="0.00"
        inputClassName="placeholder:text-muted-foreground/60"
      />
      <Button
        variant="turbo"
        disabled={
          amount === 0 || isCreatingOnrampSession || isCreatedOnrampSession
        }
        onClick={handleSubmit}
      >
        {isCreatingOnrampSession ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Creating...
          </>
        ) : isCreatedOnrampSession ? (
          <>
            <Check className="size-4" />
            Opening Coinbase...
          </>
        ) : (
          'Buy on Coinbase'
        )}
      </Button>
    </div>
  );
};
