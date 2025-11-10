import { useCallback, useMemo, useState } from 'react';

import { useWriteContract } from 'wagmi';
import { base } from 'wagmi/chains';
import { waitForTransactionReceipt } from '@wagmi/core';
import { erc20Abi, parseUnits } from 'viem';

import { useMutation } from '@tanstack/react-query';

import { toast } from 'sonner';

import { createWagmiConfig, wagmiConfig } from '@/app/_contexts/wagmi/config';

import { BASE_USDC } from '@/lib/tokens/usdc';

import { useEvmTokenBalance } from '../balance/token/use-evm-token-balance';
import { useEvmNativeBalance } from '../balance/native/use-evm-balance';

import { ethereumAddressSchema } from '@/lib/schemas';

import type { Address, Hash } from 'viem';
import type { Token } from '@/types/token';
import { useWalletChain } from '@/app/_contexts/wallet-chain/hook';

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
    token = BASE_USDC,
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
    data: ethBalance,
    isLoading: isEthBalanceLoading,
    invalidate: invalidateEthBalance,
  } = useEvmNativeBalance({ chain });
  const {
    data: balance,
    isLoading: isBalanceLoading,
    invalidate: invalidateBalance,
  } = useEvmTokenBalance({
    token,
  });

  const {
    mutate: confirmTransactionReceipt,
    isPending: isConfirming,
    isSuccess: isConfirmed,
  } = useMutation({
    mutationFn: async (hash: Hash) => {
      return waitForTransactionReceipt(createWagmiConfig(), {
        hash,
        chainId: base.id,
        confirmations: 1,
      });
    },
    onSuccess: () => {
      toast.success(
        toastMessage ? toastMessage(amount!) : `${amount} USDC sent`
      );
      void invalidateBalance();
      void invalidateEthBalance();
      setAmount(0);
      onSuccess?.();
    },
  });

  const {
    writeContract,
    isPending: isSending,
    isSuccess: isSent,
  } = useWriteContract({
    mutation: {
      onSuccess: hash => {
        confirmTransactionReceipt(hash);
      },
      onError: error => {
        toast.error('Failed to send USDC', {
          description: error.message,
        });
      },
    },
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
    const parsedAddress = parseResult.data;
    writeContract({
      address: token.address as Address,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [parsedAddress, parseUnits(amount.toString(), 6)],
    });
  }, [toAddress, amount, writeContract]);

  const statusText = useMemo(() => {
    if (isEthBalanceLoading || isBalanceLoading) return 'Loading...';
    if (!ethBalance) return 'Insufficient ETH';
    if (!amount) return 'Enter an amount';
    if (!balance || balance < amount) return 'Insufficient USDC';
    if (isSending) return 'Sending...';
    if (isConfirming) return 'Confirming...';
    if (isConfirmed) return 'Confirmed';
    return 'Send USDC';
  }, [isEthBalanceLoading, isBalanceLoading, ethBalance, balance, amount]);

  return {
    handleSubmit,
    toAddress,
    setToAddress,
    amount,
    setAmount,
    isSending,
    isSent,
    isConfirming,
    isConfirmed,
    isEthBalanceLoading,
    isBalanceLoading,
    ethBalance,
    balance,
    isInvalid:
      !amount ||
      !balance ||
      balance < amount ||
      isEthBalanceLoading ||
      !ethBalance,
    isPending: isSending || isConfirming || isSent,
    statusText,
  };
};
