import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { Chains } from '@/app/_components/chains';

import { formatTokenAmount } from '@/lib/token';

import type { Chain } from '@/types/chain';

interface Props {
  isPending: boolean;
  allRequiredFieldsFilled: boolean;
  execute: () => void;
  isLoading: boolean;
  chains: Chain[];
  maxAmountRequired: bigint;
  text?: string;
}

export const FetchState: React.FC<Props> = ({
  isPending,
  allRequiredFieldsFilled,
  execute,
  isLoading,
  chains,
  maxAmountRequired,
  text = 'Fetch',
}) => {
  return (
    <Button
      variant="primaryOutline"
      size="lg"
      className="w-full"
      disabled={isPending || !allRequiredFieldsFilled || isLoading}
      onClick={execute}
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
          {text}
          <span>{formatTokenAmount(maxAmountRequired)}</span>
        </>
      )}
    </Button>
  );
};
