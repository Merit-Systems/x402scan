import { skipToken } from "@tanstack/react-query";

import { Chain } from "@/types/chain";
import { useWalletChain } from "@/app/(app)/composer/_contexts/wallet-chain/hook";
import { ItemContainer } from "./item";
import { api } from "@/trpc/client";
import { useEvmTokenBalance } from "@/app/(app)/composer/_hooks/balance/token/use-evm-token-balance";
import { usdc } from "@/lib/tokens/usdc";
import { Skeleton } from "@/components/ui/skeleton";
import { solanaAddressSchema } from "@/lib/schemas";

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
  const isValidAddress = solanaAddressSchema.safeParse(address).success;

  const { data: balance, isLoading } = api.public.solana.balance.useQuery(
    isValidAddress ? { ownerAddress: address } : skipToken
  );

  return <BalanceItem balance={balance} isLoading={isLoading} />;
};

type EvmBalanceProps = {
  chain: Chain;
} & Props;

const EvmBalance: React.FC<EvmBalanceProps> = ({ chain }) => {
  const { data: balance, isLoading } = useEvmTokenBalance({
    token: usdc(chain),
  });

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
        <div className="rounded-md border bg-muted p-2">
          {isLoading ? (
            <Skeleton className="h-6 w-16" />
          ) : balance === undefined ? null : (
            <p>{balance} USDC</p>
          )}
        </div>
      }
    />
  );
};
