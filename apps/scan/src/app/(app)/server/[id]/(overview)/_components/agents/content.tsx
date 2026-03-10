'use client';

import { useState } from 'react';
import { BotOff } from 'lucide-react';

import Image from 'next/image';

import { Code } from '@/components/ui/code';
import { Card } from '@/components/ui/card';
import { CopyButton } from '@/components/ui/copy-button';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

import { AgentCard } from '@/app/(app)/composer/(home)/_components/lib/agent-card';
import { defaultAgentsSorting } from '@/app/(app)/_contexts/sorting/agents/default';
import { ALL_TIME_TIMEFRAME } from '@/types/timeframes';

import { api } from '@/trpc/client';

import { decodeHtmlEntities } from '@/lib/utils';

const INITIAL_LIMIT = 5;

interface Props {
  originId: string;
}

export const OriginAgentsContent: React.FC<Props> = ({ originId }) => {
  const [[origin]] = api.public.origins.list.withResources.useSuspenseQuery({
    originIds: [originId],
  });

  const [agents] = api.public.agents.list.useSuspenseQuery({
    originId,
    timeframe: ALL_TIME_TIMEFRAME,
    pagination: { page: 0, page_size: 20 },
    sorting: defaultAgentsSorting,
  });

  const [showAllAgents, setShowAllAgents] = useState(false);

  if (!origin) return null;

  const command = `npx agentcash add ${origin.origin}`;
  const originName = origin.title
    ? decodeHtmlEntities(origin.title)
    : new URL(origin.origin).hostname;

  const visibleAgents = showAllAgents
    ? agents.items
    : agents.items.slice(0, INITIAL_LIMIT);
  const hasMoreAgents = agents.items.length > INITIAL_LIMIT;

  return (
    <div className="flex flex-col gap-6">
      {/* Install section */}
      <Card className="flex flex-col gap-3 p-4">
        <a
          href="https://agentcash.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 font-semibold text-sm transition-colors hover:text-[oklch(0.5946_0.1624_144.21)]"
        >
          <Image src="/agentcash.svg" alt="AgentCash" width={18} height={18} className="rounded-sm" />
          Save with AgentCash
        </a>
        <p className="text-sm text-muted-foreground">
          Save {originName} to your agent for future use
        </p>
        <div className="flex items-center w-full border rounded-md overflow-hidden pr-1 bg-muted [&_.shiki]:p-0 [&_.shiki]:px-2 [&_.shiki]:py-1 [&_.shiki]:text-sm">
          <div className="flex-1 overflow-x-auto whitespace-nowrap no-scrollbar pr-2">
            <Code value={command} lang="shell" />
          </div>
          <CopyButton
            text={command}
            toastMessage="Copied! Paste to your CLI or Agent"
            className="shrink-0"
          />
        </div>
      </Card>

      {/* Agent cards */}
      {agents.items.length === 0 ? (
        <Empty className="bg-card border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BotOff />
            </EmptyMedia>
            <EmptyTitle>No agents</EmptyTitle>
            <EmptyDescription>
              No agents available for this server
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-4">
          {visibleAgents.map(agent => (
            <AgentCard key={agent.id} agentConfiguration={agent} />
          ))}
          {hasMoreAgents && !showAllAgents && (
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => setShowAllAgents(true)}
            >
              Show {agents.items.length - INITIAL_LIMIT} more
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
