import { Logo } from '@/components/logo';

import { ClientIcon } from '../../_components/client-icon';

import { clients, type Clients } from '@/app/mcp/_lib/clients';
import { cn } from '@/lib/utils';
import { ChevronsLeftRight } from 'lucide-react';

interface Props {
  client: Clients;
  connector?: React.ReactNode;
  className?: string;
  iconsContainerClassName?: string;
  text?: React.ReactNode;
}
export const ClientInstallHeader: React.FC<Props> = ({
  client,
  connector = <ChevronsLeftRight className="size-6 text-muted-foreground/60" />,
  className,
  iconsContainerClassName,
  text: textProp,
}) => {
  const { name, className: clientClassName } = clients[client];

  const text = textProp ?? (
    <>
      Add x402scan MCP to <br />
      {name}
    </>
  );

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <div className={cn('flex items-center gap-6', iconsContainerClassName)}>
        <Logo className="size-12" />
        {connector}
        <ClientIcon
          client={client}
          className={cn('size-12', clientClassName)}
        />
      </div>
      <h1 className="text-2xl md:text-3xl font-bold">{text}</h1>
    </div>
  );
};
