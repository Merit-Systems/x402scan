import { useIsInitialized } from '@coinbase/cdp-hooks';

import { ConnectWalletState } from '../1-connect';
import { LoadingState } from '../2-loading-balance';
import { AddFundsState } from '../3-add-funds';
import { FetchState } from '../4-fetch';
import { PriceConfirmationDialog } from '../price-confirmation-dialog';

import { useSvmX402FetchWithConfirmation } from '@/app/_hooks/x402/svm-with-confirmation';
import { useSPLTokenBalance } from '@/app/_hooks/balance/token/use-svm-token-balance';

import { useSolanaWallet } from '@/app/_contexts/solana/hook';

import type { SupportedChain } from '@/types/chain';
import { Chain } from '@/types/chain';

import { convertTokenAmount } from '@/lib/token';

import type { UiWalletAccount } from '@wallet-standard/react';
import type { UseMutationOptions } from '@tanstack/react-query';
import type { X402FetchResponse } from '@/app/_hooks/x402/types';

interface Props<TData = unknown> {
  allRequiredFieldsFilled: boolean;
  maxAmountRequired: bigint;
  targetUrl: string;
  requestInit?: RequestInit | ((chain: SupportedChain) => RequestInit);
  options?: Omit<UseMutationOptions<X402FetchResponse<TData>>, 'mutationFn'>;
  isTool?: boolean;
  text?: string;
}

export const FetchSvm: React.FC<Props> = ({
  allRequiredFieldsFilled,
  maxAmountRequired,
  targetUrl,
  requestInit,
  options,
  isTool = false,
  text,
}) => {
  const { connectedWallet } = useSolanaWallet();

  const { data: balance, isLoading: isLoadingBalance } = useSPLTokenBalance();

  if (!connectedWallet) {
    return <ConnectWalletState chain={Chain.SOLANA} />;
  }

  if (isLoadingBalance) {
    return (
      <LoadingState
        chain={Chain.SOLANA}
        maxAmountRequired={maxAmountRequired}
      />
    );
  }

  if (!balance || balance < convertTokenAmount(maxAmountRequired)) {
    return (
      <AddFundsState
        chain={Chain.SOLANA}
        maxAmountRequired={maxAmountRequired}
      />
    );
  }

  return (
    <FetchContent
      account={connectedWallet.account}
      allRequiredFieldsFilled={allRequiredFieldsFilled}
      maxAmountRequired={maxAmountRequired}
      targetUrl={targetUrl}
      requestInit={requestInit}
      options={options}
      isTool={isTool}
      text={text}
      balance={balance}
    />
  );
};

type FetchContentProps = {
  account: UiWalletAccount;
  isTool?: boolean;
  balance: number;
} & Omit<Props, 'chain'>;

const FetchContent: React.FC<FetchContentProps> = ({
  account,
  allRequiredFieldsFilled,
  maxAmountRequired,
  targetUrl,
  requestInit,
  options,
  isTool = false,
  text,
  balance,
}) => {
  const {
    mutate: execute,
    isPending,
    priceIncreaseInfo,
    confirmPriceIncrease,
    cancelPriceIncrease,
  } = useSvmX402FetchWithConfirmation({
    account,
    targetUrl,
    value: maxAmountRequired,
    init:
      typeof requestInit === 'function'
        ? requestInit(Chain.SOLANA)
        : requestInit,
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
  const { isInitialized } = useIsInitialized();

  // If price increase is detected, show the dialog first to let the user
  // understand the price change before checking balance
  if (priceIncreaseInfo) {
    return (
      <>
        <FetchState
          isPending={isPending}
          allRequiredFieldsFilled={allRequiredFieldsFilled}
          // Pass undefined to let the hook use its internal max value state
          // (either initial value or confirmed increased price if applicable)
          execute={() => execute(undefined)}
          isLoading={!isInitialized}
          chains={[Chain.SOLANA]}
          maxAmountRequired={maxAmountRequired}
          text={text}
        />
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
      </>
    );
  }

  // Check if we need to show insufficient funds for the initial price
  if (!balance || balance < convertTokenAmount(maxAmountRequired)) {
    return (
      <AddFundsState
        chain={Chain.SOLANA}
        maxAmountRequired={maxAmountRequired}
      />
    );
  }

  return (
    <FetchState
      isPending={isPending}
      allRequiredFieldsFilled={allRequiredFieldsFilled}
      // Pass undefined to let the hook use its internal max value state
      // (either initial value or confirmed increased price if applicable)
      execute={() => execute(undefined)}
      isLoading={!isInitialized}
      chains={[Chain.SOLANA]}
      maxAmountRequired={maxAmountRequired}
      text={text}
    />
  );
};
