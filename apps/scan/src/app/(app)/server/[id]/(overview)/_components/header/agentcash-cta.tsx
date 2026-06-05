'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Check, Copy } from 'lucide-react';

import type { RouterOutputs } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cleanExternalText } from '@/lib/utils';
import { ShareModal } from '../share-modal';

interface Props {
  origin: NonNullable<RouterOutputs['public']['origins']['get']>;
}

export const AgentCashCTA: React.FC<Props> = ({ origin }) => {
  const [showCopied, setShowCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const hostname = new URL(origin.origin).hostname.replace(/^www\./, '');
  const command = `npx agentcash try ${origin.origin}`;

  const originTitle = origin.title
    ? cleanExternalText(origin.title)
    : hostname;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(command);
    setShowCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShowCopied(false), 2500);
  }, [command]);

  return (
    <div className="flex items-center gap-2 text-sm font-semibold w-full">
      <span>Try this API with</span>
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/wallet-agentcash.svg" alt="" className="size-4 rounded-sm" />
        AgentCash
      </span>
      <div className="relative shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="shrink-0 size-fit p-2"
              size="icon"
              onClick={() => void handleCopy()}
            >
              {showCopied ? (
                <Check className="size-3" />
              ) : (
                <Copy className="size-3" />
              )}
            </Button>
          </TooltipTrigger>
          {!showCopied && (
            <TooltipContent side="right">
              <p>Copy and paste to your CLI or Agent</p>
            </TooltipContent>
          )}
        </Tooltip>
        {showCopied && (
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 whitespace-nowrap rounded-md border bg-background px-3 py-2 text-sm font-medium shadow-md flex items-center gap-2">
            <Check className="size-4 text-green-600" />
            Copied! Paste to your CLI or Agent
          </div>
        )}
      </div>
      <div className="ml-auto">
        <ShareModal originTitle={originTitle} originId={origin.id} origin={origin} />
      </div>
    </div>
  );
};

export const LoadingAgentCashCTA = () => {
  return (
    <div className="w-fit flex flex-col gap-1.5">
      <Skeleton className="w-48 h-[20px]" />
      <Skeleton className="w-64 h-[36px]" />
    </div>
  );
};
