"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { AnimatePresence, motion } from "motion/react";

export const Cta = () => {

  const { isCopied, copyToClipboard } = useCopyToClipboard();

  return (
    <div className="flex gap-4 justify-center">
      <Card className="h-12 flex gap-6 items-center w-fit rounded-xl px-4">
        <div className="flex items-center gap-12 cursor-pointer" onClick={() => void copyToClipboard('npx @x402scan/mcp install')}>
          <AnimatePresence mode="wait">
            {
              isCopied ? (
                <motion.span className="font-mono font-semibold w-[244px] text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="copied">
                  Copied
                </motion.span>
              ) : (
                <motion.span className="font-mono font-semibold w-[244px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="not-copied">
                  npx <span className="text-primary">@x402scan/mcp</span> install
                </motion.span>
              )
            }
          </AnimatePresence>
          {/* <Copy className="size-4 text-muted-foreground/80 hover:text-foreground transition-all duration-300" /> */}
        </div>
      </Card>
      <Button size='lg' className="px-6 h-12 text-white rounded-xl">
        Get Started
      </Button>
    </div>
  );
};