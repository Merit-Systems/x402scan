'use client';

import Link from 'next/link';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { AGENT_PROMPT } from '../_constants/prompts';

export function DiscoveryHubActions() {
  const { isCopied, copyToClipboard } = useCopyToClipboard(() => {
    toast.success('Copied prompt for agents');
  });

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        className="gap-1"
        onClick={() => void copyToClipboard(AGENT_PROMPT)}
      >
        {isCopied ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
        {isCopied ? 'Copied' : 'Copy Prompt for Agents'}
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link href="/resources/register">+ Add your API</Link>
      </Button>
    </div>
  );
}
