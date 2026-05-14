'use client';

import { useState } from 'react';
import { Check, ChevronDown, Copy, Terminal } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { cn } from '@/lib/utils';

const AGENT_PROMPT =
  "Read https://agentcash.dev/merchants.md and follow the guide to make my API discoverable and payable by agents. Do everything automatically. Only ask me if you need input you can't determine yourself.";

export function QuickstartPromptCard() {
  const [expanded, setExpanded] = useState(false);
  const { isCopied, copyToClipboard } = useCopyToClipboard(() => {
    toast.success('Copied prompt for agents');
  });

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
          <Terminal className="size-4 shrink-0" />
          <span>Paste into Claude Code, Cursor, or Codex.</span>
        </div>
        <Button
          size="sm"
          className="shrink-0 gap-1"
          onClick={() => void copyToClipboard(AGENT_PROMPT)}
        >
          {isCopied ? (
            <Check className="size-3.5" />
          ) : (
            <Copy className="size-3.5" />
          )}
          {isCopied ? 'Copied' : 'Copy prompt'}
        </Button>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-center gap-1.5 border-t px-4 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      >
        <span>{expanded ? 'Hide prompt' : 'Show prompt'}</span>
        <ChevronDown
          className={cn(
            'size-3 transition-transform',
            expanded && 'rotate-180'
          )}
        />
      </button>

      {expanded && (
        <div className="border-t bg-muted/50 px-4 py-3 text-sm text-muted-foreground leading-relaxed">
          {AGENT_PROMPT}
        </div>
      )}
    </Card>
  );
}
