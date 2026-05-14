import Link from 'next/link';
import { Body, Heading } from '@/app/_components/layout/page-utils';
import { Button } from '@/components/ui/button';
import { TryDiscovery } from '../../integration-spec/try-discovery';
import { QuickstartPromptCard } from './_components/prompt-card';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quickstart',
  description:
    'Use an AI coding agent to make your API discoverable and payable.',
};

export default function QuickstartPage() {
  return (
    <div>
      <Heading
        title="Quickstart with your agent"
        description="Paste one prompt into your coding agent. It figures out where you are and walks you through everything."
      />
      <Body className="gap-10">
        <QuickstartPromptCard />

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Test your API</h2>
          <p className="text-sm text-muted-foreground">
            Run discovery against your origin to see what x402scan resolves
            before you register.
          </p>
          <TryDiscovery />
        </section>

        <section className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link href="/resources/register">Add your API</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/discovery/spec">Read the spec</Link>
          </Button>
        </section>
      </Body>
    </div>
  );
}
