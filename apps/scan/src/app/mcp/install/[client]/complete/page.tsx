import { Check } from 'lucide-react';

import { notFound } from 'next/navigation';

import { Card } from '@/components/ui/card';

import { ClientInstallHeader } from '../../_components/header';

import { clients, clientSchema } from '@/app/mcp/_lib/clients';

import { cn } from '@/lib/utils';

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
      <div className="flex flex-col gap-6">
        <ClientInstallHeader
          client={parsedClient.data}
          connector={
            <div className="flex items-center">
              <ConnectorLine className="rounded-l-full" />
              <Card className="p-1 rounded-full bg-background shadow-none">
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
    </>
  );
}

const ConnectorLine = ({ className }: { className?: string }) => {
  return <div className={cn('w-3 h-0.5 bg-border', className)} />;
};
