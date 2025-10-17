'use client';

import React, { useState } from 'react';

import { Check, Loader2 } from 'lucide-react';

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

interface Props {
  address: Address;
}

export const Send: React.FC<Props> = ({ address }) => {
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

  const utils = api.useUtils();

  const handleSubmit = () => {
    writeContract(
      {
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [address, parseUnits(amount.toString(), 6)],
      },
      {
        onSuccess: () => {
          toast.success(`${amount} USDC sent to your server wallet`);
          void refetchBalance();
          void refetchEthBalance();
          for (let i = 0; i < 5; i++) {
            setTimeout(() => {
              void utils.serverWallet.usdcBaseBalance.invalidate();
            }, i * 1000);
          }
          setAmount(0);
          setTimeout(() => {
            resetSending();
          }, 2000);
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
      <MoneyInput
        setAmount={setAmount}
        placeholder="0.00"
        inputClassName="placeholder:text-muted-foreground/60"
        isBalanceMax
        showMaxButton
        decimalPlaces={6}
      />
      {!isEthBalanceLoading && ethBalance === 0 && (
        <p className="text-yellow-600 bg-yellow-600/10 p-2 rounded-md text-xs">
          Insufficient gas to pay for this transaction. Please add some ETH to
          your wallet.
        </p>
      )}
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
        {isSending ? (
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
