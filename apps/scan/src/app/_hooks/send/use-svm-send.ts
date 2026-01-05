import { useCallback, useMemo, useState } from 'react';

import { toast } from 'sonner';

import { useSPLTokenBalance } from '../balance/token/use-svm-token-balance';

import { useSvmX402Fetch } from '../x402/svm';

import { solanaAddressSchema } from '@/lib/schemas';
import { usdc } from '@/lib/tokens/usdc';

import { Chain } from '@/types/chain';

import type { Token } from '@/types/token';
import type { SolanaAddress } from '@/types/address';
import type { UiWalletAccount } from '@wallet-standard/react';

type Props = {
  account: UiWalletAccount;
  token?: Token;
  onSuccess?: () => void;
  toastMessage?: (amount: number) => string;
  address?: SolanaAddress;
  amount?: number;
};

export const useSvmSend = ({
  account,
  token = usdc(Chain.SOLANA),
  onSuccess,
  toastMessage,
  address: addressProp,
  amount: amountProp,
}: Props) => {
  const [amountState, setAmount] = useState<number>();
  const [toAddressState, setToAddress] = useState<string>();

  const amount = useMemo(
    () => amountProp ?? amountState,
    [amountProp, amountState]
  );

  const toAddress = useMemo(
    () => addressProp ?? toAddressState,
    [addressProp, toAddressState]
  );

  const {
    data: usdcBalance,
    isLoading: isUsdcBalanceLoading,
    invalidate: invalidateBalance,
  } = useSPLTokenBalance({
    tokenMint: token.address,
  });

  const {
    mutate: sendTransaction,
    isPending: isSending,
    isSuccess: isSent,
    reset,
  } = useSvmX402Fetch({
    account,
    targetUrl: `${window.location.origin}/api/send?address=${toAddress}&amount=${amount}&chain=${Chain.SOLANA}`,
    value: amount ? BigInt(amount * 10 ** token.decimals) : BigInt(0),
    init: {
      method: 'POST',
    },
    options: {
      onSuccess: () => {
        toast.success(
          toastMessage ? toastMessage(amountProp!) : `${amountProp} USDC sent`
        );
        // Invalidate balance 5 times, once every second
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

  const handleSubmit = useCallback(() => {
    const parseResult = solanaAddressSchema.safeParse(toAddress);
    if (!parseResult.success) {
      toast.error('Invalid Solana address');
      return;
    }

    if (!amount) {
      toast.error('Amount is required');
      return;
    }

    sendTransaction();
  }, [toAddress, amount, sendTransaction]);

  const statusText = useMemo(() => {
    if (isUsdcBalanceLoading) return 'Loading...';
    if (!amount) return 'Enter an amount';
    if (!usdcBalance || usdcBalance < amount) return 'Insufficient USDC';
    if (isSending) return 'Sending...';
    if (isSent) return 'USDC sent';
    return 'Send USDC';
  }, [isUsdcBalanceLoading, usdcBalance, amount, isSending, isSent]);

  return {
    handleSubmit,
    toAddress,
    setToAddress,
    amount,
    setAmount,
    isSending,
    isSent,
    isInvalid:
      !amount ||
      !usdcBalance ||
      usdcBalance < amount ||
      isUsdcBalanceLoading ||
      isSent ||
      !solanaAddressSchema.safeParse(toAddress).success,
    isPending: isSending,
    statusText,
  };
};
