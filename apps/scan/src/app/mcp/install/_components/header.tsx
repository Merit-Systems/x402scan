import { ChevronsLeftRight } from 'lucide-react';

import { Logo } from '@/components/logo';

import { ClientIcon } from '../../_components/clients/icons';

import { clients, type Clients } from '@/app/mcp/_lib/clients';
import { cn } from '@/lib/utils';

interface Props {
  client: Clients;
}
export const ClientInstallHeader: React.FC<Props> = ({ client }) => {
  const { name, className } = clients[client];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-6">
        <Logo className="size-12" />
        <ChevronsLeftRight className="size-6 text-muted-foreground/60" />
        <ClientIcon client={client} className={cn('size-12', className)} />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-bold">
          Add x402scan MCP to <br />
          {name}
        </h1>
      </div>
    </div>
  );
};
