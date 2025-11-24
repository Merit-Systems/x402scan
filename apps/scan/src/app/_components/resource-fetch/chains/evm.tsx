import { useWalletClient } from 'wagmi';

import { useIsInitialized } from '@coinbase/cdp-hooks';

import { ConnectWalletState } from '../1-connect';
import { LoadingState } from '../2-loading-balance';
import { AddFundsState } from '../3-add-funds';
import { FetchState } from '../4-fetch';
import { PriceConfirmationDialog } from '../price-confirmation-dialog';

import { useEvmTokenBalance } from '@/app/_hooks/balance/token/use-evm-token-balance';
import { useEvmX402FetchWithConfirmation } from '@/app/_hooks/x402/evm-with-confirmation';

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
}) => {
  const { data: walletClient, isLoading: isLoadingWalletClient } =
    useWalletClient();
  const { isInitialized } = useIsInitialized();

  const {
    mutate: execute,
    isPending,
    priceIncreaseInfo,
    confirmPriceIncrease,
    cancelPriceIncrease,
  } = useEvmX402FetchWithConfirmation({
    targetUrl,
    value: maxAmountRequired,
    chain,
    init: typeof requestInit === 'function' ? requestInit(chain) : requestInit,
    options: {
      ...options,
      onError: (...args) => {
        const [error] = args;
        // Don't call the original onError for price confirmation required
        if (
          error instanceof Error &&
          error.message === 'PRICE_CONFIRMATION_REQUIRED'
        ) {
          return;
        }
        options?.onError?.(...args);
      },
    },
    isTool,
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

  // Check if we need to show insufficient funds for the new price
  const requiredAmount = priceIncreaseInfo?.newPrice ?? maxAmountRequired;

  if (!balance || balance < convertTokenAmount(requiredAmount)) {
    return <AddFundsState chain={chain} maxAmountRequired={requiredAmount} />;
  }

  return (
    <>
      <FetchState
        isPending={isPending}
        allRequiredFieldsFilled={allRequiredFieldsFilled}
        execute={() => execute(undefined)}
        isLoading={isLoadingWalletClient || !isInitialized}
        chains={[chain]}
        maxAmountRequired={maxAmountRequired}
        text={text}
      />
      {priceIncreaseInfo && (
        <PriceConfirmationDialog
          open={true}
          onOpenChange={open => {
            if (!open) {
              cancelPriceIncrease();
            }
          }}
          onConfirm={confirmPriceIncrease}
          oldPrice={priceIncreaseInfo.oldPrice}
          newPrice={priceIncreaseInfo.newPrice}
        />
      )}
    </>
  );
};
