'use client';

import { Check, ChevronDown, Copy, ExternalLink, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { env } from '@/env';
import { PAGE_MARKDOWN } from '../_content/markdown';

const PAGE_PATH = '/discovery/architecture';

export function CopyPageButton() {
  const { isCopied, copyToClipboard } = useCopyToClipboard(() => {
    toast.success('Copied page as Markdown');
  });

  return (
    <div className="inline-flex items-center rounded-md border divide-x">
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 rounded-r-none border-0"
        onClick={() => void copyToClipboard(PAGE_MARKDOWN)}
      >
        {isCopied ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
        {isCopied ? 'Copied' : 'Copy page'}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="px-2 rounded-l-none border-0"
          >
            <ChevronDown className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuItem
            onClick={() => void copyToClipboard(PAGE_MARKDOWN)}
            className="flex flex-col items-start gap-0.5 py-2"
          >
            <div className="flex items-center gap-2 font-medium">
              <Copy className="size-3.5" />
              Copy page
            </div>
            <span className="text-xs text-muted-foreground ml-[22px]">
              Copy page as Markdown for LLMs
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href="/discovery/architecture.md"
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-start gap-0.5 py-2"
            >
              <div className="flex items-center gap-2 font-medium">
                <FileText className="size-3.5" />
                View as Markdown
                <ExternalLink className="size-3" />
              </div>
              <span className="text-xs text-muted-foreground ml-[22px]">
                View this page as plain text
              </span>
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={`https://claude.ai/new?q=${encodeURIComponent(`Read ${env.NEXT_PUBLIC_APP_URL}${PAGE_PATH} and answer my questions about it.`)}`}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-start gap-0.5 py-2"
            >
              <div className="flex items-center gap-2 font-medium">
                <span className="size-3.5 text-center text-xs">✦</span>
                Open in Claude
                <ExternalLink className="size-3" />
              </div>
              <span className="text-xs text-muted-foreground ml-[22px]">
                Ask questions about this page
              </span>
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={`https://chatgpt.com/?q=${encodeURIComponent(`Read ${env.NEXT_PUBLIC_APP_URL}${PAGE_PATH} and answer my questions about it.`)}`}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-start gap-0.5 py-2"
            >
              <div className="flex items-center gap-2 font-medium">
                <span className="size-3.5 text-center text-xs">◎</span>
                Open in ChatGPT
                <ExternalLink className="size-3" />
              </div>
              <span className="text-xs text-muted-foreground ml-[22px]">
                Ask questions about this page
              </span>
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
