'use client';

import type { RouterOutputs } from '@/trpc/client';
import { Code } from '@/components/ui/code';
import { CopyButton } from '@/components/ui/copy-button';
import { Skeleton } from '@/components/ui/skeleton';
import { cleanExternalText } from '@/lib/utils';
import Image from 'next/image';

interface Props {
  origin: NonNullable<RouterOutputs['public']['origins']['get']>;
}

export const AgentCashCTA: React.FC<Props> = ({ origin }) => {
  const command = `npx agentcash try ${origin.origin}`;

  return (
    <div className="w-fit max-w-full flex flex-col gap-1.5">
      <p className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm font-semibold">
        <span>
          Quickly try{' '}
          {origin.title
            ? cleanExternalText(origin.title)
            : new URL(origin.origin).hostname}{' '}
          with
        </span>
        <a
          href="https://agentcash.dev"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open AgentCash"
          className="inline-flex items-center leading-none transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Image
            src="/agentcash-wordmark-light.svg"
            alt=""
            width={118}
            height={12}
            className="h-[0.65rem] w-auto shrink-0 block dark:hidden"
          />
          <Image
            src="/agentcash-wordmark-dark.svg"
            alt=""
            width={118}
            height={12}
            className="h-[0.65rem] w-auto shrink-0 hidden dark:block"
          />
        </a>
      </p>
      <div className="flex items-center w-fit max-w-full border rounded-md overflow-hidden pr-1 bg-muted [&_.shiki]:p-0 [&_.shiki]:px-2 [&_.shiki]:py-1 [&_.shiki]:text-sm">
        <div className="flex-1 overflow-x-auto whitespace-nowrap no-scrollbar pr-2">
          <Code value={command} lang="shell" />
        </div>
        <CopyButton
          text={command}
          toastMessage="Copied! Paste to your CLI or Agent"
          className="shrink-0"
        />
      </div>
    </div>
  );
};

export const LoadingAgentCashCTA = () => {
  return (
    <div className="w-fit flex flex-col gap-1.5">
      <Skeleton className="w-32 h-[20px]" />
      <Skeleton className="w-48 h-[14px]" />
      <Skeleton className="w-64 h-[40px]" />
    </div>
  );
};
