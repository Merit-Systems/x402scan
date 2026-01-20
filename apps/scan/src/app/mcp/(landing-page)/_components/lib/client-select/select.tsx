'use client';

import { useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

import { clients, ClientTypes } from '../../../../_components/clients/data';

import { ClientIcon } from '../../../../_components/clients/icons';

import type { Route } from 'next';
import type { Clients } from '../../../../_components/clients/data';

interface Props {
  onClientSelect: (client: Clients) => void;
  clientType?: ClientTypes;
}

export const ClientsSelect: React.FC<Props> = ({
  onClientSelect,
  clientType,
}) => {
  const router = useRouter();

  return (
    <Command
      className="h-full border-none bg-transparent"
      disablePointerSelection
      value={''}
    >
      {clientType ? (
        <CommandList className="max-h-none pb-0" gradientClassName="hidden">
          <CommandGroup>
            {Object.entries(clients)
              .filter(([, client]) => client.type === clientType)
              .map(([key]) => (
                <Item
                  key={key}
                  client={key as Clients}
                  onClientSelect={onClientSelect}
                />
              ))}
          </CommandGroup>
        </CommandList>
      ) : (
        <CommandList className="max-h-52">
          <CommandGroup heading="For Knowledge Workers">
            {Object.entries(clients)
              .filter(([, client]) => client.type === ClientTypes.DESKTOP)
              .map(([key]) => (
                <Item
                  key={key}
                  client={key as Clients}
                  onClientSelect={() =>
                    router.push(
                      `/mcp/${key.toLowerCase()}` as Route<'mcp/[client]'>
                    )
                  }
                />
              ))}
          </CommandGroup>
          <CommandGroup heading="For Developers">
            {Object.entries(clients)
              .filter(
                ([, client]) =>
                  client.type === ClientTypes.IDE ||
                  client.type === ClientTypes.TERMINAL
              )
              .map(([key, client]) => (
                <Item
                  key={client.name}
                  client={key as Clients}
                  onClientSelect={onClientSelect}
                />
              ))}
          </CommandGroup>
        </CommandList>
      )}
    </Command>
  );
};

const Item = ({
  client,
  onClientSelect,
}: {
  client: Clients;
  onClientSelect: (client: Clients) => void;
}) => {
  const { name, recommended } = clients[client];
  return (
    <CommandItem
      className="gap-3 cursor-pointer hover:bg-accent transition-colors"
      defaultChecked={false}
      onSelect={() => onClientSelect(client)}
    >
      <ClientIcon client={client} width={20} height={20} />
      <div className="flex gap-2 justify-between w-full">
        <span className="text-sm font-medium">{name}</span>
        {recommended && (
          <Badge variant="primary" className="text-[10px]">
            Recommended
          </Badge>
        )}
      </div>
    </CommandItem>
  );
};
