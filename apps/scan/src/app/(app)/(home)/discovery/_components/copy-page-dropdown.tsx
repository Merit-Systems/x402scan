"use client";

import { Check, ChevronDown, Copy, ExternalLink, FileText } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

export function CopyPageDropdown({
  markdown,
  pageUrl,
  markdownPath,
}: {
  markdown: string;
  pageUrl: string;
  markdownPath: string;
}) {
  const { isCopied, copyToClipboard } = useCopyToClipboard(() => {
    toast.success("Copied page as Markdown");
  });
  const assistantPrompt = `Read ${pageUrl} and answer my questions about it.`;

  return (
    <ButtonGroup>
      <Button
        variant="outline"
        size="sm"
        onClick={() => void copyToClipboard(markdown)}
      >
        {isCopied ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
        {isCopied ? "Copied" : "Copy page"}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              aria-label="More copy options"
              variant="outline"
              size="icon-sm"
            />
          }
        >
          <ChevronDown className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuItem onClick={() => void copyToClipboard(markdown)}>
            <Copy />
            <div className="min-w-0">
              <div>Copy page</div>
              <span className="type-caption text-muted-foreground">
                Copy page as Markdown for LLMs
              </span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            render={
              <a
                href={markdownPath}
                target="_blank"
                rel="noreferrer"
                aria-label="View page as Markdown"
              />
            }
          >
            <FileText />
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                View as Markdown
                <ExternalLink className="size-3" />
              </div>
              <span className="type-caption text-muted-foreground">
                View this page as plain text
              </span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            render={
              <a
                href={`https://claude.ai/new?q=${encodeURIComponent(assistantPrompt)}`}
                target="_blank"
                rel="noreferrer"
                aria-label="Open page in Claude"
              />
            }
          >
            <span className="size-4 text-center type-caption">*</span>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                Open in Claude
                <ExternalLink className="size-3" />
              </div>
              <span className="type-caption text-muted-foreground">
                Ask questions about this page
              </span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            render={
              <a
                href={`https://chatgpt.com/?q=${encodeURIComponent(assistantPrompt)}`}
                target="_blank"
                rel="noreferrer"
                aria-label="Open page in ChatGPT"
              />
            }
          >
            <span className="size-4 text-center type-caption">o</span>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                Open in ChatGPT
                <ExternalLink className="size-3" />
              </div>
              <span className="type-caption text-muted-foreground">
                Ask questions about this page
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
}
