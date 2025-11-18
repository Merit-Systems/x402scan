import { useCallback, useState } from 'react';

import { Check, Loader2 } from 'lucide-react';

import { toast } from 'sonner';

import { useSession } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import { CopyCode } from '@/components/ui/copy-code';
import { TokenInput } from '@/components/ui/token/token-input';
import { Input } from '@/components/ui/input';

import { Chain } from '@/app/_components/chains';

import { api } from '@/trpc/client';

import { useWalletChain } from '@/app/_contexts/wallet-chain/hook';

import { ethereumAddressSchema } from '@/lib/schemas';
import { usdc } from '@/lib/tokens/usdc';

import { CHAIN_LABELS } from '@/types/chain';

export const Send: React.FC = () => {
  const [amount, setAmount] = useState(0);
  const [address, setAddress] = useState('');

  const { data: session } = useSession();

  const { chain } = useWalletChain();

  const utils = api.useUtils();
  const { data: serverWalletAddress, isLoading: isServerWalletAddressLoading } =
    api.user.serverWallet.address.useQuery(
      {
        chain,
      },
      {
        enabled: !!session,
      }
    );
  const { data: ethBalance, isLoading: isEthBalanceLoading } =
    api.user.serverWallet.nativeBalance.useQuery(
      {
        chain,
      },
      {
        enabled: !!session,
      }
    );
  const { data: balance } = api.user.serverWallet.tokenBalance.useQuery(
    {
      chain,
    },
    {
      enabled: !!session,
    }
  );

  const {
    mutate: sendTokens,
    isPending: isSending,
    isSuccess: isSent,
  } = api.user.serverWallet.sendTokens.useMutation();

  const handleSubmit = useCallback(async () => {
    const parseResult = ethereumAddressSchema.safeParse(address);
    if (!parseResult.success) {
      toast.error('Invalid address');
      return;
    }
    const parsedAddress = parseResult.data;
    sendTokens(
      {
        amount,
        address: parsedAddress,
        chain,
        token: usdc(chain),
      },
      {
        onSuccess: () => {
          toast.success(`${amount} USDC sent`);
          for (let i = 0; i < 5; i++) {
            setTimeout(() => {
              void utils.user.serverWallet.nativeBalance.invalidate({
                chain,
              });
              void utils.user.serverWallet.tokenBalance.invalidate({
                chain,
              });
            }, i * 1000);
          }
          setAmount(0);
          setAddress('');
        },
      }
    );
  }, [address, amount, sendTokens, utils, chain]);

  return (
    <div className="flex flex-col gap-4">
      <div className="gap-1 flex items-center">
        <Chain chain={chain} iconClassName="size-4" />
        <span className="font-bold text-sm">
          Send USDC on {CHAIN_LABELS[chain]}
        </span>
      </div>
      <TokenInput
        address={serverWalletAddress}
        onChange={setAmount}
        selectedToken={usdc(chain)}
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
              Insufficient gas to pay for this transaction.
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
