import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandList,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';

import { ClientIcon } from '@/app/mcp/_components/clients/icons';

import { clients, ClientTypes } from '@/app/mcp/_lib/clients';

import type { Clients } from '@/app/mcp/_lib/clients';
import type { McpSearchParams } from '@/app/mcp/_lib/params';
import type { Route } from 'next';

interface Props extends McpSearchParams {
  text?: string;
  clientType?: ClientTypes;
}

export const ClientSelect: React.FC<Props> = ({
  text = 'Get Started',
  clientType,
  ...props
}) => {
  const { invite } = props;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="xl"
          className="w-fit font-semibold px-4 md:px-8 text-sm md:text-base"
        >
          {text}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={12}
        className="p-0"
      >
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
                    <Item key={key} client={key as Clients} invite={invite} />
                  ))}
              </CommandGroup>
            </CommandList>
          ) : (
            <CommandList className="max-h-52">
              <CommandGroup heading="For Knowledge Workers">
                {Object.entries(clients)
                  .filter(([, client]) => client.type === ClientTypes.DESKTOP)
                  .map(([key]) => (
                    <Item key={key} client={key as Clients} invite={invite} />
                  ))}
              </CommandGroup>
              <CommandGroup heading="For Developers">
                {Object.entries(clients)
                  .filter(
                    ([, client]) =>
                      client.type === ClientTypes.IDE ||
                      client.type === ClientTypes.TERMINAL
                  )
                  .map(([key]) => (
                    <Item key={key} client={key as Clients} invite={invite} />
                  ))}
              </CommandGroup>
            </CommandList>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const Item = ({ client, invite }: { client: Clients; invite?: string }) => {
  const { name, recommended } = clients[client];
  return (
    <Link
      href={
        `/mcp/install/${client.toLowerCase()}${invite ? `?invite=${invite}` : ''}` as Route<'mcp/install/[client]'>
      }
    >
      <CommandItem
        className="gap-3 cursor-pointer hover:bg-accent transition-colors"
        defaultChecked={false}
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
    </Link>
  );
};
