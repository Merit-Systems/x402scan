import { useWalletClient } from 'wagmi';

import { useIsInitialized } from '@coinbase/cdp-hooks';

import { ConnectWalletState } from '../1-connect';
import { LoadingState } from '../2-loading-balance';
import { AddFundsState } from '../3-add-funds';
import { FetchState } from '../4-fetch';

import { useEvmTokenBalance } from '@/app/_hooks/balance/token/use-evm-token-balance';
import { useEvmX402Fetch } from '@/app/_hooks/x402/evm';

import { convertTokenAmount } from '@/lib/token';
import { usdc } from '@/lib/tokens/usdc';

import type { SupportedChain } from '@/types/chain';
import type { UseMutationOptions } from '@tanstack/react-query';
import type { X402FetchResponse } from '@/app/_hooks/x402/types';

interface Props<TData = unknown> {
  chain: SupportedChain;
  allRequiredFieldsFilled: boolean;
  maxAmountRequired: bigint;
  targetUrl: string;
  requestInit?: RequestInit | ((chain: SupportedChain) => RequestInit);
  options?: Omit<UseMutationOptions<X402FetchResponse<TData>>, 'mutationFn'>;
  isTool?: boolean;
  text?: string;
  skipTracking?: boolean;
}

export const FetchEvm: React.FC<Props> = ({
  chain,
  allRequiredFieldsFilled,
  maxAmountRequired,
  targetUrl,
  requestInit,
  options,
  isTool = false,
  text,
  skipTracking = false,
}) => {
  const { data: walletClient, isLoading: isLoadingWalletClient } =
    useWalletClient();
  const { isInitialized } = useIsInitialized();

  const { mutate: execute, isPending } = useEvmX402Fetch({
    targetUrl,
    value: maxAmountRequired,
    chain,
    init: typeof requestInit === 'function' ? requestInit(chain) : requestInit,
    options,
    isTool,
    skipTracking,
  });

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
      text={text}
    />
  );
};
