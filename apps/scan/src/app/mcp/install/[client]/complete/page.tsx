import Link from 'next/link';

import { Book, Check } from 'lucide-react';

import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { ClientInstallHeader } from '../../_components/header';

import { Clients, clients, clientSchema } from '@/app/mcp/_lib/clients';

import { cn } from '@/lib/utils';
import { GuideCard } from '@/app/mcp/_components/guide/guide-card';
import { ClientIcon } from '@/app/mcp/_components/client-icon';

import type { Route } from 'next';
import { Separator } from '@/components/ui/separator';

export default async function CompletePage({
  params,
}: PageProps<'/mcp/install/[client]/complete'>) {
  const { client } = await params;

  const parsedClient = clientSchema.safeParse(client);
  if (!parsedClient.success) {
    return notFound();
  }

  const { name } = clients[parsedClient.data];

  return (
    <>
      <div className="flex flex-col gap-20 pt-16">
        <div className="flex flex-col gap-4 items-center text-center w-full">
          <div className="flex flex-col gap-2 items-center text-center">
            <ClientInstallHeader
              client={parsedClient.data}
              connector={
                <div className="flex items-center">
                  <ConnectorLine className="rounded-l-full" />
                  <Card className="p-1 rounded-full shadow-none bg-card/50">
                    <Check className="size-4 text-primary" />
                  </Card>
                  <ConnectorLine className="rounded-r-full" />
                </div>
              }
              iconsContainerClassName="gap-3"
              text={'Installation Complete!'}
              className="items-center justify-center text-center"
            />
            <p className="text-muted-foreground text-center max-w-md mx-auto">
              We&apos;ve written several guides to help you get the most out of{' '}
              {name} for knowledge work.
            </p>
          </div>

          <Link href="/mcp/guide/knowledge-work">
            <Button size="xl">Get Started</Button>
          </Link>
        </div>

        <Separator />

        <div className="flex flex-col gap-4 w-full">
          <h4 className="text-lg font-semibold text">Other Resources</h4>
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
    </>
  );
}

const ConnectorLine = ({ className }: { className?: string }) => {
  return <div className={cn('w-3 h-0.5 bg-border', className)} />;
};
