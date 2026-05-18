'use client';

import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';

// Duplicated from discovery/_constants/prompts.ts to avoid cross-directory
// import issues with Turbopack in dev. Keep in sync.
const AGENT_PROMPT =
  "Read https://agentcash.dev/merchants.md and follow the guide to make my API discoverable and payable by agents. Do everything automatically. Only ask me if you need input you can't determine yourself.";

export function DiscoveryActions({
  iconOnly,
  label,
}: {
  iconOnly?: boolean;
  label?: string;
}) {
  const { isCopied, copyToClipboard } = useCopyToClipboard(() => {
    toast.success('Copied prompt for agents');
  });

  if (label) {
    return (
      <button
        onClick={() => void copyToClipboard(AGENT_PROMPT)}
        className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
      >
        {label}
        {isCopied ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </button>
    );
  }

  if (iconOnly) {
    return (
      <button
        onClick={() => void copyToClipboard(AGENT_PROMPT)}
        className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground transition-colors whitespace-nowrap"
      >
        {isCopied ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
        {isCopied ? 'Copied' : 'Copy Prompt'}
      </button>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="w-fit gap-1.5"
      onClick={() => void copyToClipboard(AGENT_PROMPT)}
    >
      {isCopied ? (
        <Check className="size-3.5" />
      ) : (
        <Copy className="size-3.5" />
      )}
      {isCopied ? 'Copied' : 'Let your agent handle it'}
    </Button>
  );
}
