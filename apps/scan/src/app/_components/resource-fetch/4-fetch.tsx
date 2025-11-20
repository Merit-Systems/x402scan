import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { JsonViewer } from '@/components/ai-elements/json-viewer';

import { Chains } from '@/app/_components/chains';

import { formatTokenAmount } from '@/lib/token';

import type { Chain } from '@/types/chain';

import type { X402FetchResponse } from '@/app/_hooks/x402/types';
import type { JsonValue } from '@/components/ai-elements/json-viewer';

interface Props {
  isPending: boolean;
  allRequiredFieldsFilled: boolean;
  execute: () => void;
  isLoading: boolean;
  chains: Chain[];
  maxAmountRequired: bigint;
  error: Error | null;
  response: X402FetchResponse | undefined;
  isTool?: boolean;
}

export const FetchState: React.FC<Props> = ({
  isPending,
  allRequiredFieldsFilled,
  execute,
  isLoading,
  chains,
  maxAmountRequired,
  error,
  response,
  isTool = false,
}) => {
  return (
    <>
      <Button
        variant="primaryOutline"
        size="lg"
        className="w-full"
        disabled={isPending || !allRequiredFieldsFilled || isLoading}
        onClick={() => execute()}
      >
        {isLoading ? (
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
      {!isTool && error && (
        <p className="text-xs text-red-600 bg-red-50 p-3 rounded-md">
          {error.message}
        </p>
      )}

      {!isTool && response && (
        <pre className="max-h-60 overflow-auto rounded-md bg-muted text-xs">
          {response.type === 'json' ? (
            <JsonViewer data={response.data as JsonValue} />
          ) : (
            <pre className="max-h-60 overflow-auto rounded-md bg-muted p-3 text-xs">
              {JSON.stringify(response.data, null, 2)}
            </pre>
          )}
        </pre>
      )}
    </>
  );
};
