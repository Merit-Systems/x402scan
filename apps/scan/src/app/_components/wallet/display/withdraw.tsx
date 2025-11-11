import { useCallback, useState } from 'react';

import Image from 'next/image';

import { Check, Loader2 } from 'lucide-react';

import { erc20Abi, parseUnits } from 'viem';

import { toast } from 'sonner';

import { useWriteContract } from 'wagmi';

import { TokenInput } from '@/components/ui/token/token-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { ethereumAddressSchema } from '@/lib/schemas';
import { BASE_USDC } from '@/lib/tokens/usdc';

import { useBalance } from '@/app/_hooks/use-balance';
import { useEthBalance } from '@/app/_hooks/use-eth-balance';

import type { Address } from 'viem';

interface Props {
  accountAddress: Address;
}

export const Withdraw: React.FC<Props> = () => {
  const [amount, setAmount] = useState(0);
  const [address, setAddress] = useState('');

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

  const handleSubmit = useCallback(async () => {
    const parseResult = ethereumAddressSchema.safeParse(address);
    if (!parseResult.success) {
      toast.error('Invalid address');
      return;
    }
    const parsedAddress = parseResult.data;
    writeContract(
      {
        address: BASE_USDC.address as Address,
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
          setAddress('');
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
    address,
    amount,
    writeContract,
    refetchBalance,
    refetchEthBalance,
    resetSending,
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="gap-1 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Image
            src="/coinbase.png"
            alt="Base"
            height={16}
            width={16}
            className="size-4 inline-block mr-1 rounded-full"
          />
          <span className="font-bold text-sm">Send USDC on Base</span>
        </div>
      </div>
      <TokenInput
        onChange={setAmount}
        label="Amount"
        selectedToken={BASE_USDC}
        inputClassName="placeholder:text-muted-foreground/60"
        isBalanceMax
      />
      <div className="flex flex-col gap-1">
        <span className="font-medium text-sm">Address</span>
        <Input
          placeholder="0x..."
          value={address}
          onChange={e => setAddress(e.target.value)}
          className="border-2 shadow-none placeholder:text-muted-foreground/60 font-mono"
        />
      </div>
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
    </div>
  );
};
