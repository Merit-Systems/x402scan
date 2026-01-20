'use client';

import { AnimatePresence, motion } from 'motion/react';

import { Check, Copy } from 'lucide-react';

import { Card } from '@/components/ui/card';

import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { cn } from '@/lib/utils';

import type { McpSearchParams } from '../../_lib/params';

interface Props extends McpSearchParams {
  className?: string;
}

export const CopyCommandButton: React.FC<Props> = ({ invite, className }) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard();

  const command = invite
    ? `npx @x402scan/mcp install --invite ${invite}`
    : 'npx @x402scan/mcp install';

  return (
    <Card
      className={cn(
        'h-12 flex gap-0 md:gap-4 justify-center md:justify-start items-center w-fit rounded-xl px-2 md:px-4 cursor-pointer',
        className
      )}
      onClick={() => void copyToClipboard(command)}
    >
      <span className="font-mono font-semibold text-sm md:text-base">
        npx <span className="text-primary">@x402scan/mcp</span> install
      </span>
      <AnimatePresence mode="wait">
        {isCopied ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            key="copied"
            className="hidden md:block"
          >
            <Check className="size-4 text-primary" />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            key="not-copied"
            className="hidden md:block"
          >
            <Copy className="size-4 text-muted-foreground/80 hover:text-foreground transition-all duration-300" />
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};
