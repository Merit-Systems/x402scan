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
    <div className={cn('flex flex-col gap-6 w-full max-w-2xl', className)}>
      <Card
        className={cn(
          'relative p-6 md:p-8 rounded-2xl cursor-pointer transition-all duration-300',
          'hover:shadow-lg hover:border-primary/30',
          'group'
        )}
        onClick={() => void copyToClipboard(PROMPT)}
      >
        <div className="flex flex-col gap-4">
          <p className="text-base md:text-lg font-mono text-foreground/90 leading-relaxed">
            {PROMPT}
          </p>
          <div className="flex justify-end">
            <AnimatePresence mode="wait">
              {isCopied ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  key="copied"
                  className="flex items-center gap-2 text-primary"
                >
                  <Check className="size-5" />
                  <span className="text-sm font-medium">Copied!</span>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  key="not-copied"
                  className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors"
                >
                  <Copy className="size-5" />
                  <span className="text-sm font-medium">Click to copy</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Card>

      <Button
        variant="turbo"
        size="xl"
        className="w-full"
        onClick={() => void copyToClipboard(PROMPT)}
      >
        <Copy className="size-5" />
        Copy Prompt to Clipboard
      </Button>
    </div>
  );
};
