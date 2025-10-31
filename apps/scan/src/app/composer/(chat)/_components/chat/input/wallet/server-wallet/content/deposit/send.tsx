'use client';

import React, { useState } from 'react';

import { Check, Loader2, Wallet } from 'lucide-react';

import { useWriteContract } from 'wagmi';

import { toast } from 'sonner';
import { erc20Abi, parseUnits } from 'viem';

import { MoneyInput } from '@/components/ui/money-input';
import { Button } from '@/components/ui/button';

import { useEthBalance } from '@/app/_hooks/use-eth-balance';
import { useBalance } from '@/app/_hooks/use-balance';

import { USDC_ADDRESS } from '@/lib/utils';

import type { Address } from 'viem';
import { api } from '@/trpc/client';
import { base } from 'viem/chains';
import { Chain } from '@/types/chain';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  address: Address;
  onSuccess?: () => void;
}

export const Send: React.FC<Props> = ({ address, onSuccess }) => {
  const [amount, setAmount] = useState(0);
  const {
    data: ethBalance,
    isLoading: isEthBalanceLoading,
    refetch: refetchEthBalance,
  } = useEthBalance();
  const { data: balance, refetch: refetchBalance } = useBalance();
  const {
    writeContract,
    isPending: isSending,
    isSuccess: isSent,
    reset: resetSending,
  } = useWriteContract();
  const { data: usdcBalance, isLoading: isUsdcBalanceLoading } = useBalance();

  const utils = api.useUtils();

  const handleSubmit = () => {
    writeContract(
      {
        address: USDC_ADDRESS[Chain.BASE],
        abi: erc20Abi,
        functionName: 'transfer',
        args: [address, parseUnits(amount.toString(), 6)],
        chainId: base.id,
      },
      {
        onSuccess: () => {
          toast.success(`${amount} USDC sent to your server wallet`);
          void refetchBalance();
          void refetchEthBalance();
          for (let i = 0; i < 5; i++) {
            setTimeout(() => {
              void utils.user.serverWallet.usdcBaseBalance.invalidate();
            }, i * 1000);
          }
          setAmount(0);
          setTimeout(() => {
            resetSending();
          }, 2000);
          onSuccess?.();
        },
        onError: error => {
          toast.error('Failed to send USDC', {
            description: error.message,
          });
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-xs">
        <p className="text-xs">
          Send USDC from your connected wallet to your agent&apos;s server
          wallet.
        </p>
        <div className="flex items-center gap-1 text-muted-foreground">
          {isUsdcBalanceLoading ? (
            <Skeleton className="h-3 w-8" />
          ) : (
            <span className="text-xs">
              {usdcBalance?.toLocaleString(undefined, {
                maximumFractionDigits: 2,
                minimumFractionDigits: 2,
                notation: 'compact',
              })}{' '}
              USDC
            </span>
          )}
          <Wallet className="size-2.5" />
        </div>
      </div>
      <MoneyInput
        setAmount={setAmount}
        placeholder="0.00"
        inputClassName="placeholder:text-muted-foreground/60"
        isBalanceMax
        showMaxButton
        decimalPlaces={6}
      />
      <Button
        variant="turbo"
        disabled={
          amount === 0 ||
          isSending ||
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
