import { FetchEvm } from './chains/evm';
import { FetchSvm } from './chains/svm';

import { Chain } from '@/types/chain';

import type { SupportedChain } from '@/types/chain';
import type { UseMutationOptions } from '@tanstack/react-query';
import type { X402FetchResponse } from '@/app/_hooks/x402/types';

interface Props<TData = unknown> {
  chains: SupportedChain[];
  allRequiredFieldsFilled: boolean;
  maxAmountRequired: bigint;
  targetUrl: string;
  requestInit?: RequestInit | ((chain: SupportedChain) => RequestInit);
  options?: Omit<UseMutationOptions<X402FetchResponse<TData>>, 'mutationFn'>;
  isTool?: boolean;
}

export const ResourceFetch: React.FC<Props> = ({
  chains,
  allRequiredFieldsFilled,
  maxAmountRequired,
  targetUrl,
  requestInit,
  options,
  isTool = false,
}) => {
  return (
    <div className="flex flex-col gap-2">
      {chains.map(chain =>
        chain === Chain.SOLANA ? (
          <FetchSvm
            key={chain}
            allRequiredFieldsFilled={allRequiredFieldsFilled}
            maxAmountRequired={maxAmountRequired}
            targetUrl={targetUrl}
            requestInit={requestInit}
            options={options}
            isTool={isTool}
          />
        ) : (
          <FetchEvm
            key={chain}
            chain={chain}
            allRequiredFieldsFilled={allRequiredFieldsFilled}
            maxAmountRequired={maxAmountRequired}
            targetUrl={targetUrl}
            requestInit={requestInit}
            options={options}
            isTool={isTool}
          />
        )
      )}
    </div>
  );
};
