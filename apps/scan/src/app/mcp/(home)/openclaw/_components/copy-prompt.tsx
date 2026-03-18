'use client';

import { AnimatePresence, motion } from 'motion/react';

import { Check, Copy } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { cn } from '@/lib/utils';

const PROMPT = `Read https://github.com/Merit-Systems/OpenClawX402/blob/main/README.md and help me set up OpenClaw with x402 tools. After you are done, help me get started and provide ideas for what to use the tools for.`;

interface Props {
  className?: string;
}

export const CopyPrompt: React.FC<Props> = ({ className }) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard();

  return (
    <div
      className={cn('flex flex-col gap-4 md:gap-6 w-full max-w-2xl', className)}
    >
      <Button
        variant="turbo"
        size="xl"
        className="w-full text-sm md:text-base"
        onClick={() => void copyToClipboard(PROMPT)}
      >
        <AnimatePresence mode="wait">
          {isCopied ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              key="copied"
              className="flex items-center gap-2"
            >
              <Check className="size-4 md:size-5" />
              Copied!
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              key="not-copied"
              className="flex items-center gap-2"
            >
              <Copy className="size-4 md:size-5" />
              Copy Prompt to Clipboard
            </motion.div>
          )}
        </AnimatePresence>
      </Button>

      <Card
        className={cn(
          'relative p-4 md:p-8 rounded-2xl cursor-pointer transition-all duration-300',
          'hover:shadow-lg hover:border-primary/30',
          'group overflow-hidden'
        )}
        onClick={() => void copyToClipboard(PROMPT)}
      >
        <p className="text-sm md:text-lg font-mono text-foreground/90 leading-relaxed break-all">
          {PROMPT}
        </p>
      </Card>
    </div>
  );
};
