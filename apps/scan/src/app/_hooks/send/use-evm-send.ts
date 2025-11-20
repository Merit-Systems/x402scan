import { useCallback, useMemo, useState } from 'react';

import { toast } from 'sonner';

import { usdc } from '@/lib/tokens/usdc';

import { useEvmTokenBalance } from '../balance/token/use-evm-token-balance';

import { ethereumAddressSchema } from '@/lib/schemas';

import { useWalletChain } from '@/app/_contexts/wallet-chain/hook';
import { useEvmX402Fetch } from '../x402/evm';

import type { Token } from '@/types/token';

interface Props {
  token?: Token;
  onSuccess?: () => void;
  toastMessage?: (amount: number) => string;
  address?: string;
  amount?: number;
}

export const useEvmSend = (props?: Props) => {
  const { chain } = useWalletChain();

  const {
    token = usdc(chain),
    onSuccess,
    toastMessage,
    address: addressProp,
    amount: amountProp,
  } = props ?? {};

  const [toAddressState, setToAddress] = useState<string>();
  const [amountState, setAmount] = useState<number>();

  const toAddress = useMemo(
    () => addressProp ?? toAddressState,
    [addressProp, toAddressState]
  );

  const amount = useMemo(
    () => amountProp ?? amountState,
    [amountProp, amountState]
  );

  const {
    data: balance,
    isLoading: isBalanceLoading,
    invalidate: invalidateBalance,
  } = useEvmTokenBalance({
    token,
  });

  const {
    mutate: sendTransaction,
    isPending: isSending,
    isSuccess: isSent,
    reset,
  } = useEvmX402Fetch({
    chain,
    targetUrl: `${window.location.origin}/api/send?address=${toAddress}&amount=${amount}&chain=${chain}`,
    value: amount ? BigInt(amount * 10 ** token.decimals) : BigInt(0),
    init: {
      method: 'POST',
    },
    options: {
      onSuccess: () => {
        toast.success(
          toastMessage ? toastMessage(amountProp!) : `${amountProp} USDC sent`
        );
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            void invalidateBalance();
          }, i * 1000);
        }
        onSuccess?.();
        setTimeout(() => {
          reset();
        }, 3000);
      },
      onError: error => {
        toast.error('Failed to send USDC', {
          description: error.message,
        });
      },
    },
    isTool: true,
  });

  const handleSubmit = useCallback(async () => {
    if (!amount) {
      toast.error('Amount is required');
      return;
    }
    const parseResult = ethereumAddressSchema.safeParse(toAddress);
    if (!parseResult.success) {
      toast.error('Invalid address');
      return;
    }
    sendTransaction();
  }, [toAddress, amount, sendTransaction]);

  const statusText = useMemo(() => {
    if (isBalanceLoading) return 'Loading...';
    if (!amount) return 'Enter an amount';
    if (!balance || balance < amount) return 'Insufficient USDC';
    if (isSending) return 'Sending...';
    if (isSent) return 'USDC sent';
    return 'Send USDC';
  }, [isBalanceLoading, balance, amount, isSending, isSent]);

  return {
    handleSubmit,
    toAddress,
    setToAddress,
    amount,
    setAmount,
    isSending,
    isSent,
    isBalanceLoading,
    balance,
    isInvalid:
      !amount ||
      !balance ||
      balance < amount ||
      isBalanceLoading ||
      isSending ||
      isSent,
    isPending: isSending,
    statusText,
  };
};
