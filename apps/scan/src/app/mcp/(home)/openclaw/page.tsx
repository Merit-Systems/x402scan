import { CopyPrompt } from './_components/copy-prompt';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OpenClaw + x402',
  description: 'Set up OpenClaw with x402 payment tools for autonomous AI agents',
};

export default function OpenClawPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-12 md:py-24">
      <div className="flex flex-col items-center gap-8 md:gap-12 max-w-3xl w-full text-center">
        {/* Header */}
        <div className="flex flex-col gap-4 md:gap-6">
          <h1 className="text-4xl md:text-6xl font-bold">
            OpenClaw + <span className="text-primary">x402</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground/70 font-mono max-w-xl mx-auto">
            Run autonomous AI agents with access to x402 payment APIs. USDC on
            Base.
          </p>
        </div>

        {/* Instructions */}
        <div className="flex flex-col gap-2 text-center">
          <p className="text-sm md:text-base text-muted-foreground">
            Paste this prompt into your AI agent to get started:
          </p>
        </div>

        {/* Copy Prompt CTA */}
        <CopyPrompt />

        {/* Footer note */}
        <p className="text-xs md:text-sm text-muted-foreground/50 max-w-md">
          Works with Claude, Cursor, Codex, and any agent that can read URLs and
          execute commands.
        </p>
      </div>
    </div>
  );
}
