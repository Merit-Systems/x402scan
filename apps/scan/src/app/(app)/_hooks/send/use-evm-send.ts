import { useCallback, useMemo, useState } from 'react';

import { toast } from 'sonner';

import { usdc } from '@/lib/tokens/usdc';

import { useEvmTokenBalance } from '../balance/token/use-evm-token-balance';

import { ethereumAddressSchema } from '@/lib/schemas';

import { useWalletChain } from '@/app/(app)/_contexts/wallet-chain/hook';
import { useEvmX402Fetch } from '../x402/evm';

import type { Token } from '@/types/token';
import type { Connection } from 'wagmi';
import type { X402FetchResponse } from '../x402/types';

interface Props {
  token?: Token;
  onSuccess?: (data: X402FetchResponse<unknown>) => void;
  toastMessage?: (amount: number) => string;
  address?: string;
  amount?: number;
  connection?: Connection;
}

export const useEvmSend = (props?: Props) => {
  const { chain } = useWalletChain();

  const {
    token = usdc(chain),
    onSuccess,
    toastMessage,
    address: addressProp,
    amount: amountProp,
    connection,
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
    address: connection?.accounts[0],
  });

  const {
    mutate: sendTransaction,
    isPending: isSending,
    isSuccess: isSent,
    reset,
  } = useEvmX402Fetch({
    chain,
    connection,
    targetUrl: `${window.location.origin}/api/send?address=${toAddress}&amount=${amount}&chain=${chain}`,
    value: amount ? BigInt(amount * 10 ** token.decimals) : BigInt(0),
    init: {
      method: 'POST',
    },
    options: {
      onSuccess: data => {
        toast.success(
          toastMessage ? toastMessage(amountProp!) : `${amountProp} USDC sent`
        );
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            void invalidateBalance();
          }, i * 1000);
        }
        onSuccess?.(data);
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

  const handleSubmit = useCallback(() => {
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
      isSent ||
      !ethereumAddressSchema.safeParse(toAddress).success,
    isPending: isSending,
    statusText,
  };
};
