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

interface Props {
  address: Address;
}

export const CopyAddress: React.FC<Props> = ({ address }) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard(() => {
    toast.success('Address copied to clipboard');
  });
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={() => void copyToClipboard(address)}
          variant="outline"
          className="shrink-0 size-fit md:size-fit p-2"
          size="icon"
        >
          {isCopied ? (
            <Check className="size-3" />
          ) : (
            <Copy className="size-3" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="font-mono">{address}</p>
      </TooltipContent>
    </Tooltip>
  );
};
