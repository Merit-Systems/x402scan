import { useIsInitialized } from '@coinbase/cdp-hooks';
import { useWalletClient } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { formatTokenAmount } from '@/lib/token';
import { useResourceFetch } from '../contexts/fetch/hook';
import { WalletDialog } from '@/app/_components/wallet/dialog';
import { Chain } from '@/types/chain';
import { Chains } from '@/app/_components/chains';

interface Props {
  chains: Chain[];
}

export const FetchButton: React.FC<Props> = ({ chains }) => {
  const { data: walletClient, isLoading: isLoadingWalletClient } =
    useWalletClient();
  const { isInitialized } = useIsInitialized();

  const { execute, isPending, allRequiredFieldsFilled, maxAmountRequired } =
    useResourceFetch();

  console.log('chains', chains);

  const includesBase = chains.includes(Chain.BASE);

  if (!walletClient) {
    return (
      <WalletDialog>
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={e => {
            e.stopPropagation();
          }}
        >
          <Chains chains={chains} />
          Connect Wallet
        </Button>
      </WalletDialog>
    );
  }

  return (
    <Button
      variant="primaryOutline"
      size="lg"
      className="w-full"
      disabled={
        isPending ||
        !allRequiredFieldsFilled ||
        isLoadingWalletClient ||
        !isInitialized ||
        !walletClient ||
        !includesBase
      }
      onClick={() => execute()}
    >
      {!includesBase ? (
        <p className="text-xs">Solana Support Coming Soon</p>
      ) : isLoadingWalletClient || !isInitialized || !walletClient ? (
        <Loader2 className="size-4 animate-spin" />
      ) : isPending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Fetching
        </>
      ) : (
        <>
          <Chains chains={chains} />
          Fetch
          <span>{formatTokenAmount(maxAmountRequired)}</span>
        </>
      )}
    </Button>
  );
};
