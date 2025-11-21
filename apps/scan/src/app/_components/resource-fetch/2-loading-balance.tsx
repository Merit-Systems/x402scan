import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { Chain } from '@/app/_components/chains';

import { formatTokenAmount } from '@/lib/token';

import type { Chain as ChainType } from '@/types/chain';

interface Props {
  chain: ChainType;
  maxAmountRequired: bigint;
}

export const LoadingState: React.FC<Props> = ({ chain, maxAmountRequired }) => {
  return (
    <Button variant="primaryOutline" size="lg" className="w-full" disabled>
      <Chain chain={chain} />
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>{formatTokenAmount(maxAmountRequired)}</span>
    </Button>
  );
};
