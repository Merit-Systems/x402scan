import { Book } from 'lucide-react';

import { Separator } from '@/components/ui/separator';

import { GuideBanner } from '../_components/banner';
import { GuideCard } from '../_components/guide-card';
import { ClientIcon } from '../../_components/client-icon';

import { Clients } from '../../_lib/clients';

import { cn } from '@/lib/utils';

import type { Route } from 'next';

export default function GuidePage() {
  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-16 w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold">Resources & Guides</h1>
        <p className="text-muted-foreground text-lg">
          How to get the most out of the x402scan MCP
        </p>
      </div>
      <GuideBanner />
      <Separator />
      <div className="flex flex-col gap-4 w-full">
        <h4 className="font-medium text">Other Resources</h4>
        <GuideCard
          title="Automating Knowledge Work with x402"
          description="Learn about x402 and how it enables agents to make microtransactions"
          Icon={({ className }) => <Book className={className} />}
          href={`/mcp/guide/knowledge-work` as Route<'mcp/guide/[task]'>}
        />
        <GuideCard
          title="Claude Code for Knowledge Workers"
          description="Learn about x402 and how it enables agents to make microtransactions"
          Icon={({ className }) => (
            <ClientIcon
              client={Clients.ClaudeCode}
              className={cn(className, 'fill-white')}
            />
          )}
          href={
            `/mcp/guide/build-enrichment-workflows` as Route<'mcp/guide/[task]'>
          }
        />
        <GuideCard
          title="x402 and Agentic Commerce"
          description="Learn about x402 and how it enables agents to make microtransactions"
          Icon={({ className }) => <Book className={className} />}
          href={
            `/mcp/guide/build-enrichment-workflows` as Route<'mcp/guide/[task]'>
          }
        />
      </div>
    </div>
  );
}
