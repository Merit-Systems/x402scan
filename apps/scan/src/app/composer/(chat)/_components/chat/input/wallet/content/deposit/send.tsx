'use client';

import React, { useState } from 'react';

import { Check, Loader2 } from 'lucide-react';

import { createConfig, useWriteContract } from 'wagmi';
import { waitForTransactionReceipt } from '@wagmi/core';

import { toast } from 'sonner';
import { erc20Abi, parseUnits } from 'viem';

import { Button } from '@/components/ui/button';

import { useEthBalance } from '@/app/_hooks/use-eth-balance';
import { useBalance } from '@/app/_hooks/use-balance';

import { USDC_ADDRESS } from '@/lib/utils';

import type { Address } from 'viem';
import { api } from '@/trpc/client';
import { base } from 'viem/chains';
import { Chain } from '@/types/chain';
import { TokenInput } from '@/components/ui/token/token-input';
import { BASE_USDC } from '@/lib/tokens/usdc';
import { useQueryClient } from '@tanstack/react-query';
import { wagmiConfig } from '@/app/_contexts/wagmi/config';

interface Props {
  address: Address;
  onSuccess?: () => void;
}

export const Send: React.FC<Props> = ({ address, onSuccess }) => {
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState(0);
  const [isWaitingForReceipt, setIsWaitingForReceipt] = useState(false);
  const {
    data: ethBalance,
    isLoading: isEthBalanceLoading,
    queryKey: ethBalanceQueryKey,
  } = useEthBalance();
  const { data: balance, queryKey: balanceQueryKey } = useBalance();
  const {
    writeContractAsync,
    isPending: isSending,
    isSuccess: isSent,
    reset: resetSending,
  } = useWriteContract({
    mutation: {
      onError: error => {
        toast.error('Failed to send USDC', {
          description: error.message,
        });
      },
    },
  });

  const utils = api.useUtils();

  const handleSubmit = async () => {
    const hash = await writeContractAsync({
      address: USDC_ADDRESS[Chain.BASE],
      abi: erc20Abi,
      functionName: 'transfer',
      args: [address, parseUnits(amount.toString(), 6)],
      chainId: base.id,
    });
    setIsWaitingForReceipt(true);
    await waitForTransactionReceipt(createConfig(wagmiConfig), {
      hash,
      chainId: base.id,
      confirmations: 2,
    });
    setIsWaitingForReceipt(false);
    toast.success(`${amount} USDC sent to your server wallet`);
    await utils.user.serverWallet.usdcBaseBalance.invalidate();
    void queryClient.invalidateQueries({ queryKey: balanceQueryKey });
    void queryClient.invalidateQueries({ queryKey: ethBalanceQueryKey });
    setTimeout(() => {
      onSuccess?.();
    }, 1000);
    setAmount(0);
    setTimeout(() => {
      resetSending();
    }, 2000);
  };

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
        disabled={
          amount === 0 ||
          isSending ||
          isSent ||
          !balance ||
          balance < amount ||
          isEthBalanceLoading ||
          !ethBalance
        }
        onClick={handleSubmit}
      >
        {isEthBalanceLoading ? (
          'Loading...'
        ) : !ethBalance ? (
          'Insufficient ETH'
        ) : isSending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Sending...
          </>
        ) : isWaitingForReceipt ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Waiting for Confirmation...
          </>
        ) : isSent ? (
          <>
            <Check className="size-4" />
            USDC sent
          </>
        ) : (
          'Send USDC'
        )}
      </Button>
    </div>
  );
};
