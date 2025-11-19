import { useWalletClient } from 'wagmi';

import { useIsInitialized } from '@coinbase/cdp-hooks';

import { ConnectWalletState } from '../1-connect';
import { LoadingState } from '../2-loading-balance';
import { AddFundsState } from '../3-add-funds';
import { FetchState } from '../4-fetch';

import { useEvmTokenBalance } from '@/app/_hooks/balance/token/use-evm-token-balance';
import { useEvmX402Fetch } from '@/app/_hooks/x402/evm';

import { convertTokenAmount } from '@/lib/token';

import type { SupportedChain } from '@/types/chain';
import { usdc } from '@/lib/tokens/usdc';

interface Props {
  chain: SupportedChain;
  allRequiredFieldsFilled: boolean;
  maxAmountRequired: bigint;
  targetUrl: string;
  requestInit?: RequestInit;
}

export const FetchEvm: React.FC<Props> = ({
  chain,
  allRequiredFieldsFilled,
  maxAmountRequired,
  targetUrl,
  requestInit,
}) => {
  const { data: walletClient, isLoading: isLoadingWalletClient } =
    useWalletClient();
  const { isInitialized } = useIsInitialized();

  const {
    data: response,
    mutate: execute,
    isPending,
    error,
  } = useEvmX402Fetch(targetUrl, maxAmountRequired, chain, requestInit);

  const { data: balance, isLoading: isLoadingBalance } = useEvmTokenBalance({
    token: usdc(chain),
  });

  if (!walletClient) {
    return <ConnectWalletState chain={chain} />;
  }

  if (isLoadingBalance) {
    return <LoadingState chain={chain} maxAmountRequired={maxAmountRequired} />;
  }

  if (!balance || balance < convertTokenAmount(maxAmountRequired)) {
    return (
      <AddFundsState chain={chain} maxAmountRequired={maxAmountRequired} />
    );
  }

  return (
    <FetchState
      isPending={isPending}
      allRequiredFieldsFilled={allRequiredFieldsFilled}
      execute={execute}
      isLoading={isLoadingWalletClient || !isInitialized}
      chains={[chain]}
      maxAmountRequired={maxAmountRequired}
      error={error}
      response={response}
    />
  );
};
