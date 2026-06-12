'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronDown, Check, Copy, ExternalLink } from 'lucide-react';

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

type WalletId = 'agentcash' | 'poncho' | 'awal' | 'circle' | 'paysh';

interface WalletOption {
  id: WalletId;
  label: string;
  icon: string;
  getCommand: (origin: string, hostname: string) => string;
  /** When set, the action button navigates to this URL instead of copying */
  getUrl?: (origin: string, hostname: string) => string;
}

const wallets: WalletOption[] = [
  {
    id: 'agentcash',
    label: 'AgentCash',
    icon: '/wallet-agentcash.svg',
    getCommand: origin => `npx agentcash try ${origin}`,
  },
  {
    id: 'poncho',
    label: 'Poncho',
    icon: '/wallet-poncho.svg',
    getCommand: (_, hostname) => `https://tryponcho.com/m/${hostname}`,
    getUrl: (_, hostname) => `https://tryponcho.com/m/${hostname}`,
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
  const walletUrl = wallet.getUrl?.(origin.origin, hostname);

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

  const handleAction = useCallback(() => {
    if (walletUrl) {
      window.open(walletUrl, '_blank', 'noopener,noreferrer');
    } else {
      void handleCopy();
    }
  }, [walletUrl, handleCopy]);

  return (
    <div className="flex items-center gap-2 w-fit text-sm">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-1.5 text-sm shrink-0">
            Try with
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={wallet.icon} alt="" className="size-4 rounded-sm" />
            {wallet.label}
            <ChevronDown className="size-3" />
          </Button>
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
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="shrink-0 size-fit p-2"
            size="icon"
            onClick={handleAction}
          >
            {walletUrl ? (
              <ExternalLink className="size-3" />
            ) : showCopied ? (
              <Check className="size-3" />
            ) : (
              <Copy className="size-3" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>
            {walletUrl
              ? 'Open in Poncho'
              : showCopied
                ? 'Copied!'
                : 'Copy command'}
          </p>
        </TooltipContent>
      </Tooltip>
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
