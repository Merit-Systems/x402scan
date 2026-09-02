import { CopyButton } from "@/components/ui/copy-button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { ComponentProps } from "react";

interface CodeCardProps extends Omit<ComponentProps<typeof Card>, "children"> {
  code: string;
  codeClassName?: string;
  copyLabel?: string;
  highlight?: "command";
  loading?: boolean;
  onCopy?: () => void;
  onCopyError?: () => void;
}

function renderCode(code: string, highlight: CodeCardProps["highlight"]) {
  if (highlight !== "command") return code;

  const command = /^(\s*)(\S+)(\s*)([\s\S]*)$/.exec(code);
  if (!command) return code;

  return (
    <>
      {command[1]}
      <span data-slot="code-card-command">{command[2]}</span>
      {command[3]}
      <span data-slot="code-card-argument">{command[4]}</span>
    </>
  );
}

function CodeCard({
  code,
  codeClassName,
  copyLabel,
  highlight,
  loading,
  onCopy,
  onCopyError,
  className,
  ...props
}: CodeCardProps) {
  return (
    <Card
      className={cn("relative", className)}
      variant="muted"
      {...props}
      data-highlight={highlight}
      data-slot="code-card"
    >
      <pre className="overflow-x-auto p-4 pr-12">
        <code className={cn("type-code", codeClassName)}>
          {renderCode(code, highlight)}
        </code>
      </pre>
      <CopyButton
        className="absolute top-3 right-2"
        label={copyLabel}
        loading={loading}
        onCopy={onCopy}
        onCopyError={onCopyError}
        value={code}
        variant="quiet"
      />
    </Card>
  );
}

export { CodeCard };
export type { CodeCardProps };
