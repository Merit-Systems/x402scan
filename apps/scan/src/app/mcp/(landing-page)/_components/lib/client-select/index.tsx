'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { ClientsSelect } from './select';
import { SelectedClient } from './selected';

import type { Clients } from '../../../../_components/clients/data';
import type { ClientTypes } from '../../../../_components/clients/data';

interface Props {
  text?: string;
  clientType?: ClientTypes;
  inviteCode?: string;
}

export const ClientSelect: React.FC<Props> = ({
  text = 'Get Started',
  clientType,
  inviteCode,
}) => {
  const [selectedClient, setSelectedClient] = useState<Clients | null>(null);

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
        {selectedClient ? (
          <SelectedClient
            client={selectedClient}
            reset={() => setSelectedClient(null)}
            inviteCode={inviteCode}
          />
        ) : (
          <ClientsSelect
            onClientSelect={setSelectedClient}
            clientType={clientType}
          />
        )}
      </PopoverContent>
    </Popover>
  );
};
