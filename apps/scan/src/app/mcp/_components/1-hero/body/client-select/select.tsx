'use client';

import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

import { clients } from '../../../lib/clients/data';

import { ClientIcon } from '../../../lib/clients/icons';

import type { Clients } from '../../../lib/clients/data';

interface Props {
  onClientSelect: (client: Clients) => void;
}

export const ClientsSelect = ({ onClientSelect }: Props) => {
  return (
    <Command
      className="h-full border-none bg-transparent"
      disablePointerSelection
      value={''}
    >
      <CommandInput
        placeholder="Search Clients"
        containerClassName="py-0.5 px-3 h-fit"
      />
      <CommandList className="max-h-[198px]">
        <CommandEmpty>No results found.</CommandEmpty>
        {Object.entries(clients).map(([key, client]) => (
          <CommandItem
            key={client.name}
            className="px-4 py-3 gap-3 cursor-pointer hover:bg-accent hover:text-accent-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground rounded-none"
            defaultChecked={false}
            onSelect={() => onClientSelect(key as Clients)}
          >
            <ClientIcon client={key as Clients} width={20} height={20} />
            <div className="flex gap-2 justify-between w-full">
              <span className="text-sm font-medium">{client.name}</span>
              {client.recommended && (
                <Badge variant="primary" className="text-[10px]">
                  Recommended
                </Badge>
              )}
            </div>
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  );
};
