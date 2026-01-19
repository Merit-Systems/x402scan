import { cn } from '@/lib/utils';

import type { Clients } from '../lib/clients/data';
import { ClientIcon } from '../lib/clients/icons';

interface Props {
  heading: string;
  description: string;
  cta: React.ReactNode;
  graphic: React.ReactNode;
  imageSide: 'left' | 'right';
  clients: Clients[];
  clientIconClassName?: string;
}

export const ClientDemosSection: React.FC<Props> = ({
  heading,
  description,
  cta,
  graphic,
  imageSide,
  clients,
  clientIconClassName,
}) => {
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
        <div className="flex flex-col gap-4 px-16">
          <div className="flex gap-2">
            {clients.map(client => (
              <ClientIcon
                key={client}
                client={client}
                className={cn('size-10 fill-primary', clientIconClassName)}
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
