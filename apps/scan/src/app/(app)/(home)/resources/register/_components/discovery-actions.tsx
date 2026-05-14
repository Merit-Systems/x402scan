'use client';

import Link from 'next/link';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';

// Duplicated from discovery/_constants/prompts.ts to avoid cross-directory
// import issues with Turbopack in dev. Keep in sync.
const AGENT_PROMPT =
  "Read https://agentcash.dev/merchants.md and follow the guide to make my API discoverable and payable by agents. Do everything automatically. Only ask me if you need input you can't determine yourself.";

export function DiscoveryActions() {
  const { isCopied, copyToClipboard } = useCopyToClipboard(() => {
    toast.success('Copied prompt for agents');
  });

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="outline"
        className="w-56 gap-1"
        onClick={() => void copyToClipboard(AGENT_PROMPT)}
      >
        {isCopied ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
        {isCopied ? 'Copied' : 'Copy Prompt for Agents'}
      </Button>
      <Button asChild size="sm" variant="outline" className="w-56 gap-1">
        <Link href="/discovery">
          For Humans
          <span aria-hidden>→</span>
        </Link>
      </Button>
    </div>
  );
}
