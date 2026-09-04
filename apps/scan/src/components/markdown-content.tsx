"use client";

import { Streamdown } from "streamdown";
import { Typeset } from "@/components/ui/typeset";
import { cn } from "@/lib/utils";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div className={cn("mx-auto max-w-4xl px-4 py-8 md:px-6", className)}>
      <Typeset>
        <Streamdown>{content}</Streamdown>
      </Typeset>
    </div>
  );
}
