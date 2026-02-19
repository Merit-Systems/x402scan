import React from 'react';

import { Button } from '@/components/ui/button';

import { WalletDialog } from '@/app/(app)/_components/wallet/dialog';
import { Chain } from '@/app/(app)/_components/chains';

import { formatTokenAmount } from '@/lib/token';

import type { SupportedChain } from '@/types/chain';

interface Props {
  chain: SupportedChain;
  maxAmountRequired: bigint;
}

export const AddFundsState: React.FC<Props> = ({
  chain,
  maxAmountRequired,
}) => {
  return (
    <WalletDialog initialChain={chain} isFixed initialTab="deposit">
      <Button variant="primaryOutline" size="lg" className="w-full">
        <Chain chain={chain} />
        Add Funds
        <span>{formatTokenAmount(maxAmountRequired)}</span>
      </Button>
    </WalletDialog>
  );
};
