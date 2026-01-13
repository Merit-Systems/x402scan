'use client';

import { Check, Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';

import { toast } from 'sonner';

import type { Address } from 'viem';
import { useEvmTokenBalance } from '@/app/_hooks/balance/token/use-evm-token-balance';
import { usdc } from '@/lib/tokens/usdc';
import { Chain } from '@/types/chain';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  address: Address;
}

export const CopyAddress: React.FC<Props> = ({ address }) => {
  const { data: balance, isLoading: isLoadingBalance } = useEvmTokenBalance({
    token: usdc(Chain.BASE),
    address,
  });

  const { copyToClipboard } = useCopyToClipboard(() => {
    toast.success('Address copied to clipboard');
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild disabled={isLoadingBalance}>
        <Button
          onClick={() => void copyToClipboard(address)}
          variant="outline"
          className="shrink-0 size-fit md:size-fit px-2 py-1"
        >
          {balance !== undefined ? (
            <span>{formatCurrency(balance)}</span>
          ) : (
            <Skeleton className="h-[14px] my-[3px] w-8" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="p-0 overflow-hidden">
        <p className="font-medium border-b bg-muted p-2 text-sm">
          Your MCP Server
        </p>
        <div className="p-2 flex flex-col gap-1 border-b">
          <p className="font-semibold text-xs">Balance</p>
          <p>{balance ? formatCurrency(balance) : 'Loading...'}</p>
        </div>
        <div className="p-2 flex flex-col gap-1">
          <p className="font-medium text-xs">Address</p>
          <p className="font-mono">{address}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
