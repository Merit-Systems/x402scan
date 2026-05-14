'use client';

import { Check, Copy, Terminal } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';

const AGENT_PROMPT =
  "Read https://agentcash.dev/merchants.md and follow the guide to make my API discoverable and payable by agents. Do everything automatically. Only ask me if you need input you can't determine yourself.";

export function QuickstartPromptCard() {
  const { isCopied, copyToClipboard } = useCopyToClipboard(() => {
    toast.success('Copied prompt for agents');
  });

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-5">
        <div className="flex items-center justify-between gap-4">
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
        <div className="rounded-md bg-muted px-3 py-2.5 text-sm text-muted-foreground leading-relaxed">
          {AGENT_PROMPT}
        </div>
      </CardContent>
    </Card>
  );
}
