import Link from 'next/link';
import { Body, Heading } from '@/app/_components/layout/page-utils';
import { Button } from '@/components/ui/button';
import { CopyForAgentsButton } from '../../integration-spec/copy-for-agents-button';
import { AgentPromptPreview } from '../../integration-spec/agent-prompt-preview';
import { TryDiscovery } from '../../integration-spec/try-discovery';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quickstart',
  description:
    'Use an AI coding agent to make your API discoverable and payable.',
};

const AGENT_PROMPT =
  "Read https://agentcash.dev/merchants.md and follow the guide to make my API discoverable and payable by agents. Do everything automatically. Only ask me if you need input you can't determine yourself.";

export default function QuickstartPage() {
  return (
    <div>
      <Heading
        title="Quickstart with your agent"
        description="Copy this prompt into your coding agent and it will figure out where you are and what you need in order to start selling to agents."
        actions={
          <div className="flex items-center gap-2">
            <CopyForAgentsButton text={AGENT_PROMPT} />
            <Button asChild variant="outline" size="sm">
              <Link href="/resources/register">Add your API</Link>
            </Button>
          </div>
        }
      />
      <Body className="gap-10">
        <section className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Agent prompt</h2>
              <p className="text-sm text-muted-foreground">
                Paste this directly into Claude Code, Cursor, or Codex. It
                handles discovery implementation and validation end-to-end.
              </p>
            </div>
            <CopyForAgentsButton text={AGENT_PROMPT} />
          </div>
          <AgentPromptPreview prompt={AGENT_PROMPT} />
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Test your API</h2>
          <p className="text-sm text-muted-foreground">
            Run discovery against your origin to see what x402scan resolves
            before you register.
          </p>
          <TryDiscovery />
        </section>

        <section className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Whether you&apos;re building from scratch, wrapping an existing API,
            or already supporting x402, your agent will classify your situation
            automatically and walk you through the next steps.
          </p>
          <div className="flex items-center gap-2">
            <Button asChild size="sm">
              <Link href="/resources/register">Add your API</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/discovery/spec">Read the spec</Link>
            </Button>
          </div>
        </section>
      </Body>
    </div>
  );
}
