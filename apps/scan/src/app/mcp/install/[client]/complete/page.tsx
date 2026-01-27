import { Book, Check } from 'lucide-react';

import { notFound } from 'next/navigation';

import { Card } from '@/components/ui/card';

import { ClientInstallHeader } from '../../_components/header';

import { Clients, clients, clientSchema } from '@/app/mcp/_lib/clients';

import { cn } from '@/lib/utils';
import { GuideBanner } from '@/app/mcp/_components/guide/banner';
import { GuideCard } from '@/app/mcp/_components/guide/guide-card';
import type { Route } from 'next';
import { ClientIcon } from '@/app/mcp/_components/client-icon';

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
      <div className="flex flex-col gap-16">
        <div className="flex flex-col gap-2">
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
        <GuideBanner />
        <div className="flex flex-col gap-4">
          <GuideCard
            title="x402 and Agentic Commerce"
            description="Learn about x402 and how it enables agents to make microtransactions"
            Icon={({ className }) => <Book className={className} />}
            href={
              `/mcp/guide/build-enrichment-workflows` as Route<'mcp/guide/[task]'>
            }
          />
          <GuideCard
            title="Claude Code for Knowledge Workers"
            description="Learn about x402 and how it enables agents to make microtransactions"
            Icon={({ className }) => (
              <ClientIcon
                client={Clients.ClaudeCode}
                className={cn(
                  className,
                  'fill-neutral-500 dark:fill-neutral-400'
                )}
              />
            )}
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
