"use client";

import { Check, Copy } from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

interface CopyForAgentsButtonProps {
  text: string;
}

export function CopyForAgentsButton({ text }: CopyForAgentsButtonProps) {
  const { isCopied, copyToClipboard } = useCopyToClipboard(() => {
    toast.success("Copied agent integration checklist");
  });

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={() => void copyToClipboard(text)}
    >
      {isCopied ? (
        <Check className="size-3.5" />
      ) : (
        <Copy className="size-3.5" />
      )}
      {isCopied ? "Copied" : "Copy for Agents"}
    </Button>
  );
}
