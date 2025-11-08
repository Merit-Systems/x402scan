import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { useCallback, useState } from 'react';
import { ethereumAddressSchema } from '@/lib/schemas';
import { toast } from 'sonner';
import { Check, Loader2, Wallet } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { api } from '@/trpc/client';
import { CopyCode } from '@/components/ui/copy-code';
import { TokenInput } from '@/components/ui/token/token-input';
import { BASE_USDC } from '@/lib/tokens/usdc';

export const Send: React.FC = () => {
  const [amount, setAmount] = useState(0);
  const [address, setAddress] = useState('');

  const utils = api.useUtils();
  const { data: serverWalletAddress, isLoading: isServerWalletAddressLoading } =
    api.user.serverWallet.address.useQuery();
  const { data: ethBalance, isLoading: isEthBalanceLoading } =
    api.user.serverWallet.ethBaseBalance.useQuery();
  const { isLoading: isBalanceLoading, data: balance } =
    api.user.serverWallet.usdcBaseBalance.useQuery();

  const {
    mutate: sendUsdc,
    isPending: isSending,
    isSuccess: isSent,
  } = api.user.serverWallet.sendUSDC.useMutation();

  const handleSubmit = useCallback(async () => {
    const parseResult = ethereumAddressSchema.safeParse(address);
    if (!parseResult.success) {
      toast.error('Invalid address');
      return;
    }
    const parsedAddress = parseResult.data;
    sendUsdc(
      {
        amount,
        toAddress: parsedAddress,
      },
      {
        onSuccess: () => {
          toast.success(`${amount} USDC sent`);
          for (let i = 0; i < 5; i++) {
            setTimeout(() => {
              void utils.user.serverWallet.ethBaseBalance.invalidate();
              void utils.user.serverWallet.usdcBaseBalance.invalidate();
            }, i * 1000);
          }
          setAmount(0);
          setAddress('');
        },
      }
    );
  }, [address, amount, sendUsdc, utils]);

  return (
    <div className="flex flex-col gap-4">
      <div className="gap-1 flex items-center">
        <Image
          src="/coinbase.png"
          alt="Base"
          height={16}
          width={16}
          className="size-4 inline-block mr-1 rounded-full"
        />
        <span className="font-bold text-sm">Send USDC on Base</span>
      </div>
      <TokenInput
        address={serverWalletAddress}
        onChange={setAmount}
        selectedToken={BASE_USDC}
        label="Amount"
        placeholder="0.00"
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
      {!isEthBalanceLoading &&
        !isServerWalletAddressLoading &&
        ethBalance === 0 && (
          <div className="flex flex-col gap-1  bg-yellow-600/10 p-2 rounded-md">
            <p className="text-yellow-600 text-xs">
              Insufficient gas to pay for this transaction. Please add some ETH
              to your wallet.
            </p>
            <CopyCode
              code={serverWalletAddress ?? ''}
              toastMessage="Copied to clipboard"
            />
          </div>
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
