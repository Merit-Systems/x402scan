import { FetchEvm } from './chains/evm';
import { FetchSvm } from './chains/svm';

import { cn } from '@/lib/utils';

import { Chain } from '@/types/chain';

import type { SupportedChain } from '@/types/chain';
import type { UseMutationOptions } from '@tanstack/react-query';
import type { X402FetchResponse } from '@/app/_hooks/x402/types';

type Props<TData = unknown> = {
  chains: SupportedChain[];
  allRequiredFieldsFilled: boolean;
  maxAmountRequired: bigint;
  targetUrl: string;
  requestInit?: RequestInit | ((chain: SupportedChain) => RequestInit);
  options?: Omit<UseMutationOptions<X402FetchResponse<TData>>, 'mutationFn'>;
  isTool?: boolean;
  text?: string;
};

export const ResourceFetch: React.FC<Props> = ({
  chains,
  allRequiredFieldsFilled,
  maxAmountRequired,
  targetUrl,
  requestInit,
  options,
  isTool = false,
  text,
}) => {
  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-2 gap-2',
        chains.length % 2 === 1 ? 'md:[&>*:last-child]:col-span-2' : ''
      )}
    >
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
            text={text}
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
            text={text}
          />
        )
      )}
    </div>
  );
};
