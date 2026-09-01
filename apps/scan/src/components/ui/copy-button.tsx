"use client";

import { Check, Copy, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";

type CopyButtonProps = Omit<
  ButtonProps,
  "aria-label" | "children" | "onClick" | "type" | "value"
> & {
  value: string;
  loading?: boolean;
  label?: string;
  onCopy?: () => void;
  onCopyError?: () => void;
};

function CopyButton({
  value,
  loading = false,
  label = "Copy to clipboard",
  onCopy,
  onCopyError,
  disabled,
  size = "icon-sm",
  variant = "ghost",
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(
    () => () => {
      clearTimeout(resetTimer.current);
    },
    []
  );

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      onCopyError?.();
      return;
    }

    setCopied(true);
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => {
      setCopied(false);
    }, 2_000);
    onCopy?.();
  }

  const Icon = loading ? LoaderCircle : copied ? Check : Copy;

  return (
    <Button
      {...props}
      aria-busy={loading || undefined}
      aria-label={loading ? "Copying" : copied ? "Copied" : label}
      disabled={loading ? true : disabled}
      onClick={() => void copyValue()}
      size={size}
      type="button"
      variant={variant}
    >
      <Icon className={loading ? "animate-spin" : undefined} />
    </Button>
  );
}

export { CopyButton };
export type { CopyButtonProps };
