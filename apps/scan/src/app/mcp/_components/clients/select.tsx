'use client';

import Image from 'next/image';

import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from '@/components/ui/command';
import { clients } from './data';

import type { Clients as ClientsEnum } from './data';

interface Props {
  onClientSelect: (client: ClientsEnum) => void;
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
        containerClassName="py-2 px-3 h-fit"
        className="py-1"
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {Object.entries(clients).map(([key, client]) => (
          <CommandItem
            key={client.name}
            className="p-4 gap-3 cursor-pointer hover:bg-accent hover:text-accent-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
            defaultChecked={false}
            onSelect={() => onClientSelect(key as ClientsEnum)}
          >
            <Image
              src={client.image}
              alt={client.name}
              width={20}
              height={20}
            />
            <span className="text-sm font-medium">{client.name}</span>
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  );
};
