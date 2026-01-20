'use client';

import { AnimatePresence, motion } from 'motion/react';

import { Check, Copy } from 'lucide-react';

import { Card } from '@/components/ui/card';

import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';

interface Props {
  inviteCode?: string;
}

export const CopyCommandButton: React.FC<Props> = ({ inviteCode }) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard();

  const command = inviteCode
    ? `npx @x402scan/mcp install --invite ${inviteCode}`
    : 'npx @x402scan/mcp install';

  return (
    <Card
      className="h-12 flex gap-4 items-center w-fit rounded-xl px-4 cursor-pointer"
      onClick={() => void copyToClipboard(command)}
    >
      <span className="font-mono font-semibold">
        npx <span className="text-primary">@x402scan/mcp</span> install
      </span>
      <AnimatePresence mode="wait">
        {isCopied ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            key="copied"
          >
            <Check className="size-4 text-primary" />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            key="not-copied"
          >
            <Copy className="size-4 text-muted-foreground/80 hover:text-foreground transition-all duration-300" />
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};
