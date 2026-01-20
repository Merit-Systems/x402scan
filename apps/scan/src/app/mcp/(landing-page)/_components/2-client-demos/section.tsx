import { cn } from '@/lib/utils';

import { ClientIcon } from '../../../_components/clients/icons';

import { clients as clientsData } from '../../../_components/clients/data';

import type { Clients, ClientTypes } from '../../../_components/clients/data';

interface Props {
  heading: string;
  description: string;
  cta: React.ReactNode;
  graphic: React.ReactNode;
  imageSide: 'left' | 'right';
  clientType: ClientTypes;
  clientIconClassName?: string;
}

export const ClientDemosSection: React.FC<Props> = ({
  heading,
  description,
  cta,
  graphic,
  imageSide,
  clientType,
  clientIconClassName,
}) => {
  const clients = Object.entries(clientsData)
    .filter(([, client]) => client.type === clientType)
    .map(([key]) => key as Clients);

  return (
    <div
      className={cn(
        'flex items-center gap-4',
        imageSide === 'right' ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <div className="flex-1 bg-muted rounded-xl overflow-hidden">
        {graphic}
      </div>
      <div className="flex-1">
        <div className="flex flex-col gap-4 px-12">
          <div className="flex gap-2">
            {clients.map(client => (
              <ClientIcon
                key={client}
                client={client}
                className={cn(
                  'fill-primary',
                  clients.length > 1 ? 'size-8' : 'size-10',
                  clientIconClassName
                )}
              />
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold">{heading}</h2>
            <p className="font-mono max-w-md text-muted-foreground/60">
              {description}
            </p>
          </div>
          {cta}
        </div>
      </div>
    </div>
  );
};
