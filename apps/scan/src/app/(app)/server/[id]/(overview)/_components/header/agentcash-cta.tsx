'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronDown, Check, Copy } from 'lucide-react';

import type { RouterOutputs } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Props {
  origin: NonNullable<RouterOutputs['public']['origins']['get']>;
}

type WalletId = 'agentcash' | 'awal' | 'circle' | 'paysh';

interface WalletOption {
  id: WalletId;
  label: string;
  icon: string;
  getCommand: (origin: string, hostname: string) => string;
}

const wallets: WalletOption[] = [
  {
    id: 'agentcash',
    label: 'AgentCash',
    icon: '/wallet-agentcash.svg',
    getCommand: origin => `npx agentcash try ${origin}`,
  },
  {
    id: 'awal',
    label: 'awal',
    icon: '/coinbase.png',
    getCommand: (_, hostname) => `npx awal x402 bazaar search ${hostname}`,
  },
  {
    id: 'circle',
    label: 'Agent Wallet',
    icon: '/wallet-circle.ico',
    getCommand: (_, hostname) => `circle services search "${hostname}"`,
  },
  {
    id: 'paysh',
    label: 'pay.sh',
    icon: '/wallet-paysh.png',
    getCommand: origin => `pay curl ${origin}`,
  },
];

export const AgentCashCTA: React.FC<Props> = ({ origin }) => {
  const [selectedWallet, setSelectedWallet] = useState<WalletId>('agentcash');
  const [showCopied, setShowCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const hostname = new URL(origin.origin).hostname.replace(/^www\./, '');
  const wallet = wallets.find(w => w.id === selectedWallet)!;
  const command = wallet.getCommand(origin.origin, hostname);

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
    <div className="flex items-center gap-2 w-fit bg-muted/50 rounded-lg px-3 py-2.5 text-sm">
      <span className="text-sm font-semibold shrink-0 text-muted-foreground">Try with</span>
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:opacity-80 cursor-pointer focus:outline-none shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={wallet.icon} alt="" className="size-4 rounded-sm" />
          {wallet.label}
          <ChevronDown className="size-3" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {wallets.map(w => (
            <DropdownMenuItem
              key={w.id}
              onClick={() => setSelectedWallet(w.id)}
              className={`gap-2 ${w.id === selectedWallet ? 'font-semibold' : ''}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={w.icon} alt="" className="size-4 rounded-sm" />
              {w.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
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
