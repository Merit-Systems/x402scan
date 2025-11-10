'use client';

import React from 'react';

import { Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { Address } from 'viem';
import { api } from '@/trpc/client';
import { TokenInput } from '@/components/ui/token/token-input';
import { BASE_USDC } from '@/lib/tokens/usdc';
import { useEvmSend } from '@/app/_hooks/send/use-evm-send';

interface Props {
  address: Address;
  onSuccess?: () => void;
}

export const Send: React.FC<Props> = ({ address, onSuccess }) => {
  const utils = api.useUtils();

  const {
    handleSubmit,
    setAmount,
    isInvalid,
    isPending,
    statusText,
    isConfirmed,
  } = useEvmSend({
    token: BASE_USDC,
    onSuccess: () => {
      onSuccess?.();
      void utils.user.serverWallet.usdcBaseBalance.invalidate();
    },
    toastMessage: amount => `${amount} USDC sent to your server wallet`,
    addressProp: address,
  });

  return (
    <div className="flex flex-col gap-2">
      <TokenInput
        onChange={setAmount}
        placeholder="0.00"
        inputClassName="placeholder:text-muted-foreground/60"
        isBalanceMax
        selectedToken={BASE_USDC}
        label="Fund from Connected Wallet"
      />
      <Button
        variant="turbo"
        disabled={isInvalid || isPending}
        onClick={handleSubmit}
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : isConfirmed ? (
          <Check className="size-4" />
        ) : null}
        {statusText}
      </Button>
    </div>
  );
};
