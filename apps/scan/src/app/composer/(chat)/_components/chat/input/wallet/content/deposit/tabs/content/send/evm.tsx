import { Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { usdc } from '@/lib/tokens/usdc';

import { useEvmSend } from '@/app/_hooks/send/use-evm-send';

import { api } from '@/trpc/client';

import type { SupportedChain } from '@/types/chain';

interface Props {
  amount: number;
  chain: SupportedChain;
  onSuccess?: () => void;
}

export const SendToServerWalletEVM: React.FC<Props> = ({
  amount,
  chain,
  onSuccess,
}) => {
  const utils = api.useUtils();

  const { data: serverWalletAddress, isLoading: isServerWalletAddressLoading } =
    api.user.serverWallet.address.useQuery({
      chain,
    });

  const { handleSubmit, isPending, isInvalid, statusText, isConfirmed } =
    useEvmSend({
      token: usdc(chain),
      address: serverWalletAddress!,
      amount,
      onSuccess: () => {
        void utils.user.serverWallet.tokenBalance.invalidate({
          chain,
        });
        onSuccess?.();
      },
    });

  return (
    <Button
      variant="turbo"
      disabled={
        isInvalid ||
        isPending ||
        isServerWalletAddressLoading ||
        !serverWalletAddress
      }
      onClick={handleSubmit}
    >
      {isPending || isServerWalletAddressLoading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : isConfirmed ? (
        <Check className="size-4" />
      ) : null}
      {statusText}
    </Button>
  );
};
