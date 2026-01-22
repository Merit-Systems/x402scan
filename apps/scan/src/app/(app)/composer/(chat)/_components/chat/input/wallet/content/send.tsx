import { useCallback, useState } from 'react';

import { Check, CheckCircle, Loader2 } from 'lucide-react';

import { toast } from 'sonner';

import { useSession } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import { TokenInput } from '@/components/ui/token/token-input';
import { Input } from '@/components/ui/input';

import { Chain } from '@/app/(app)/_components/chains';

import { api } from '@/trpc/client';

import { useWalletChain } from '@/app/(app)/_contexts/wallet-chain/hook';

import { evmAddressSchema, solanaAddressSchema } from '@/lib/schemas';
import { usdc } from '@/lib/tokens/usdc';
import { formatAddress } from '@/lib/utils';

import { CHAIN_LABELS } from '@/types/chain';

import { Chain as ChainType } from '@/types/chain';

export const Send: React.FC = () => {
  const [amount, setAmount] = useState(0);
  const [address, setAddress] = useState('');

  const { data: session } = useSession();

  const { chain } = useWalletChain();

  const utils = api.useUtils();
  const { data: serverWalletAddress } = api.user.serverWallet.address.useQuery(
    {
      chain,
    },
    {
      enabled: !!session,
    }
  );
  const { data: balance, isLoading: isBalanceLoading } =
    api.user.serverWallet.tokenBalance.useQuery(
      {
        chain,
      },
      {
        enabled: !!session,
      }
    );

  const {
    mutate: sendUsdc,
    isPending: isSending,
    isSuccess: isSent,
    reset,
  } = api.user.serverWallet.sendUsdc.useMutation();

  const schema =
    chain === ChainType.SOLANA ? solanaAddressSchema : evmAddressSchema;

  const handleSubmit = useCallback(() => {
    const parseResult = schema.safeParse(address);
    if (!parseResult.success) {
      toast.error('Invalid address');
      return;
    }
    const parsedAddress = parseResult.data;
    sendUsdc(
      {
        amount,
        address: parsedAddress,
        chain,
      },
      {
        onSuccess: () => {
          toast.success(`${amount} USDC sent`);
          for (let i = 0; i < 5; i++) {
            setTimeout(() => {
              void utils.user.serverWallet.tokenBalance.invalidate({
                chain,
              });
            }, i * 1000);
          }
        },
      }
    );
  }, [address, amount, sendUsdc, utils, chain, schema]);

  if (isSent) {
    return (
      <WithdrawSuccess
        amount={amount}
        toAddress={address}
        onReset={() => {
          setAmount(0);
          setAddress('');
          reset();
        }}
      />
    );
  }

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
        chain={chain}
        balanceProp={{
          balance: balance,
          isLoading: isBalanceLoading,
        }}
      />
      <div className="flex flex-col gap-1">
        <span className="font-medium text-sm">Address</span>
        <Input
          placeholder={chain === ChainType.SOLANA ? 'Solana Address' : '0x...'}
          value={address}
          onChange={e => setAddress(e.target.value)}
          className="border-2 shadow-none placeholder:text-muted-foreground/60 font-mono"
        />
      </div>
      <Button
        variant="turbo"
        disabled={
          !amount ||
          !address ||
          isSending ||
          !balance ||
          balance < amount ||
          !schema.safeParse(address).success
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

interface Props {
  amount: number;
  toAddress: string;
  onReset: () => void;
}

const WithdrawSuccess: React.FC<Props> = ({ amount, toAddress, onReset }) => {
  return (
    <div className="flex flex-col gap-2 items-center justify-center p-4 bg-muted rounded-lg">
      <CheckCircle className="size-10 text-green-600" />
      <p className="text-center">
        You have successfully sent{' '}
        <span className="font-bold">{amount} USDC</span> to{' '}
        <span className="font-bold">{formatAddress(toAddress)}</span>
      </p>
      <Button onClick={onReset}>Send Again</Button>
    </div>
  );
};
