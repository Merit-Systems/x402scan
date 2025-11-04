import { useCallback, useState } from 'react';

import { Check, Loader2 } from 'lucide-react';

import { useWriteContract } from 'wagmi';

import { erc20Abi, parseUnits } from 'viem';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { useBalance } from '@/app/_hooks/balance/use-evm-balance';
import { useEthBalance } from '@/app/_hooks/use-eth-balance';

import { USDC_ADDRESS } from '@/lib/utils';
import { ethereumAddressSchema } from '@/lib/schemas';

import { Chain } from '@/types/chain';

interface Props {
  address: string;
  amount: number;
  toAddress: string;
  setAmount: (amount: number) => void;
}

export const WithdrawEVM: React.FC<Props> = ({
  address,
  amount,
  toAddress,
  setAmount,
}) => {
  const {
    data: ethBalance,
    isLoading: isEthBalanceLoading,
    refetch: refetchEthBalance,
  } = useEthBalance();
  const {
    isLoading: isBalanceLoading,
    data: balance,
    refetch: refetchBalance,
  } = useBalance();

  const {
    writeContract,
    isPending: isSending,
    isSuccess: isSent,
    reset: resetSending,
  } = useWriteContract();

  const handleSubmit = useCallback(async () => {
    const parseResult = ethereumAddressSchema.safeParse(toAddress);
    if (!parseResult.success) {
      toast.error('Invalid address');
      return;
    }
    const parsedAddress = parseResult.data;
    writeContract(
      {
        address: USDC_ADDRESS[Chain.BASE] as `0x${string}`,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [parsedAddress, parseUnits(amount.toString(), 6)],
      },
      {
        onSuccess: () => {
          toast.success(`${amount} USDC sent`);
          void refetchBalance();
          void refetchEthBalance();
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
  }, [
    toAddress,
    amount,
    writeContract,
    refetchBalance,
    refetchEthBalance,
    resetSending,
  ]);

  return (
    <>
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
          !address ||
          !ethereumAddressSchema.safeParse(address).success ||
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
    </>
  );
};
