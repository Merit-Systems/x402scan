import { forwardRef } from 'react';

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
}

export const FetchButton: React.FC<Props> = ({
  isPending,
  allRequiredFieldsFilled,
  execute,
  isLoading,
  chains,
  maxAmountRequired,
}) => {
  return (
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
  );
};

interface ConnectWalletButtonProps {
  chains: Chain[];
  onClick?: () => void;
}

export const ConnectWalletButton = forwardRef<
  HTMLButtonElement,
  ConnectWalletButtonProps
>(({ chains, onClick }, ref) => {
  return (
    <Button
      ref={ref}
      variant="outline"
      size="lg"
      className="w-full"
      onClick={e => {
        e.stopPropagation();
        if (onClick) onClick();
      }}
    >
      <Chains chains={chains} />
      Connect Wallet
    </Button>
  );
});
ConnectWalletButton.displayName = 'ConnectWalletButton';
