import { Chain } from '@/types/chain';
import { useWalletChain } from '../../../../../_contexts/wallet-chain/hook';
import { ItemContainer } from './item';
import { Loading } from '@/components/ui/loading';
import { api } from '@/trpc/client';
import { useBalance } from '@/app/_hooks/balance/use-evm-balance';
import { usdc } from '@/lib/tokens/usdc';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  address: string;
}

export const Balance: React.FC<Props> = ({ address }) => {
  const { chain } = useWalletChain();

  if (chain === Chain.SOLANA) {
    return <SolanaBalance address={address} />;
  }

  return <EvmBalance address={address} chain={chain} />;
};

const SolanaBalance: React.FC<Props> = ({ address }) => {
  const { data: balance, isLoading } = api.public.solana.balance.useQuery({
    ownerAddress: address,
  });

  return <BalanceItem balance={balance} isLoading={isLoading} />;
};

interface EvmBalanceProps extends Props {
  chain: Chain;
}

const EvmBalance: React.FC<EvmBalanceProps> = ({ chain }) => {
  const { data: balance, isLoading } = useBalance(usdc(chain));

  return <BalanceItem balance={balance} isLoading={isLoading} />;
};

const BalanceItem = ({
  balance,
  isLoading,
}: {
  balance: number | undefined;
  isLoading: boolean;
}) => {
  return (
    <ItemContainer
      label="Balance"
      value={
        <div className="bg-muted rounded-md border p-2">
          <Loading
            value={balance}
            isLoading={isLoading}
            component={value => <p>{value} USDC</p>}
            loadingComponent={<Skeleton className="h-6 w-16" />}
          />
        </div>
      }
    />
  );
};
